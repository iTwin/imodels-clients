/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

import { ChangesetResponse, IModelsErrorImpl } from "@itwin/imodels-client-management/lib/base/internal";
import { ChangesetOperations as ManagementChangesetOperations } from "@itwin/imodels-client-management/lib/operations";

import { Changeset, ChangesetState, IModelScopedOperationParams, IModelsErrorCode, isIModelsApiError } from "@itwin/imodels-client-management";

import { DownloadProgressParam, DownloadedChangeset, GenericAbortSignal, TargetDirectoryParam } from "../../base/types";
import { assertLink } from "../CommonFunctions";
import { DownloadFileParams, downloadFile } from "../FileDownload";
import { OperationOptions } from "../OperationOptions";

import { ChangesetPropertiesForCreate, CreateChangesetParams, DownloadChangesetListParams, DownloadSingleChangesetParams } from "./ChangesetOperationParams";
import { LimitedParallelQueue } from "./LimitedParallelQueue";

/** Function called to report how many bytes were downloaded since the last time this function was called. */
type DownloadCallback = (bytesDownloaded: number) => void;

/** Function called after failure to report how many bytes were downloaded before downloaded was stopped due to failure. */
type DownloadFailedCallback = (bytesDownloadedBeforeFailure: number) => void;

interface DownloadChangesetFileWithRetryParams extends IModelScopedOperationParams {
  changeset: DownloadedChangeset;
  abortSignal?: GenericAbortSignal;
  downloadCallback?: DownloadCallback;
  firstDownloadFailedCallback?: DownloadFailedCallback;
}

export class ChangesetOperations<TOptions extends OperationOptions> extends ManagementChangesetOperations<TOptions>{
  /**
   * Creates a Changeset. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel-changeset/ Create iModel Changeset}
   * operation from iModels API. Internally it creates a Changeset instance, uploads the Changeset
   * file and confirms Changeset file upload. The execution of this method depends on the Changeset file size - the larger
   * the file, the longer the upload will take.
   * @param {CreateChangesetParams} params parameters for this operation. See {@link CreateChangesetParams}.
   * @returns newly created Changeset. See {@link Changeset}.
   */
  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const changesetFileSize = await this._options.localFileSystem.getFileSize(params.changesetProperties.filePath);
    const createChangesetBody = this.getCreateChangesetRequestBody(params.changesetProperties, changesetFileSize);
    const createChangesetResponse = await this.sendPostRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetListUrl({ iModelId: params.iModelId }),
      body: createChangesetBody,
      headers: params.headers
    });

    const uploadLink = createChangesetResponse.changeset._links.upload;
    assertLink(uploadLink);
    await this._options.cloudStorage.upload({
      url: uploadLink.href,
      data: params.changesetProperties.filePath
    });

    const completeLink = createChangesetResponse.changeset._links.complete;
    assertLink(completeLink);
    const confirmUploadBody = this.getConfirmUploadRequestBody(params.changesetProperties);
    const confirmUploadResponse = await this.sendPatchRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: completeLink.href,
      body: confirmUploadBody,
      headers: params.headers
    });

    const result = this.appendRelatedEntityCallbacks(params.authorization, confirmUploadResponse.changeset, params.headers);
    return result;
  }

  /**
   * Downloads a single Changeset identified by either index or id. If an error occurs when downloading a Changeset
   * this operation queries the failed Changeset by id and retries the download once. If the Changeset file with
   * the expected name already exists in the target directory and the file size matches the one expected the Changeset
   * is not downloaded again.
   * @param {DownloadSingleChangesetParams} params parameters for this operation. See {@link DownloadSingleChangesetParams}.
   * @returns downloaded Changeset. See {@link DownloadedChangeset}.
   */
  public async downloadSingle(params: DownloadSingleChangesetParams): Promise<DownloadedChangeset> {
    await this._options.localFileSystem.createDirectory(params.targetDirectoryPath);

    const changeset: Changeset = await this.querySingleInternal(params);
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  /**
   * Downloads Changeset list. Internally the method uses {@link ChangesetOperations.getRepresentationList} to query the
   * Changeset collection so this operation supports most of the the same url parameters to specify what Changesets to
   * download. One of the most common properties used are `afterIndex` and `lastIndex` to download Changeset range. This
   * operation downloads Changesets in parallel. If an error occurs when downloading a Changeset this operation queries
   * the failed Changeset by id and retries the download once. If the Changeset file with the expected name already
   * exists in the target directory and the file size matches the one expected the Changeset is not downloaded again.
   * @param {DownloadChangesetListParams} params parameters for this operation. See {@link DownloadChangesetListParams}.
   * @returns downloaded Changeset metadata along with the downloaded file path. See {@link DownloadedChangeset}.
   */
  public async downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]> {
    await this._options.localFileSystem.createDirectory(params.targetDirectoryPath);

    const [downloadCallback, downloadFailedCallback] = await this.provideDownloadCallbacks(params) ?? [];

    let result: DownloadedChangeset[] = [];
    for await (const changesetPage of this.getRepresentationList(params).byPage()) {
      const changesetsWithFilePath: DownloadedChangeset[] = changesetPage.map(
        (changeset: Changeset) => ({
          ...changeset,
          filePath: path.join(params.targetDirectoryPath, this.createFileName(changeset.id))
        }));
      result = result.concat(changesetsWithFilePath);

      // We sort the changesets by fileSize in descending order to download small
      // changesets first because their SAS tokens have a shorter lifespan.
      changesetsWithFilePath.sort((changeset1: DownloadedChangeset, changeset2: DownloadedChangeset) => changeset1.fileSize - changeset2.fileSize);

      const queue = new LimitedParallelQueue({ maxParallelPromises: 10 });
      for (const changeset of changesetsWithFilePath)
        queue.push(async () => this.downloadChangesetFileWithRetry({
          authorization: params.authorization,
          iModelId: params.iModelId,
          changeset,
          abortSignal: params.abortSignal,
          downloadCallback,
          firstDownloadFailedCallback: downloadFailedCallback,
          headers: params.headers
        }));
      await queue.waitAll();
    }

    return result;
  }

  private getCreateChangesetRequestBody(
    changesetProperties: ChangesetPropertiesForCreate,
    changesetFileSize: number
  ): object {
    return {
      id: changesetProperties.id,
      description: changesetProperties.description,
      parentId: changesetProperties.parentId,
      briefcaseId: changesetProperties.briefcaseId,
      containingChanges: changesetProperties.containingChanges,
      fileSize: changesetFileSize,
      synchronizationInfo: changesetProperties.synchronizationInfo,
      groupId: changesetProperties.groupId
    };
  }

  private getConfirmUploadRequestBody(changesetProperties: ChangesetPropertiesForCreate): object {
    return {
      state: ChangesetState.FileUploaded,
      briefcaseId: changesetProperties.briefcaseId
    };
  }

  private async downloadSingleChangeset(
    params: IModelScopedOperationParams & TargetDirectoryParam & { changeset: Changeset } & DownloadProgressParam
  ): Promise<DownloadedChangeset> {
    const changesetWithPath: DownloadedChangeset = {
      ...params.changeset,
      filePath: path.join(params.targetDirectoryPath, this.createFileName(params.changeset.id))
    };

    const downloadCallback = params.progressCallback ? (bytes: number) => params.progressCallback?.(bytes, changesetWithPath.fileSize) : undefined;

    await this.downloadChangesetFileWithRetry({
      authorization: params.authorization,
      iModelId: params.iModelId,
      changeset: changesetWithPath,
      abortSignal: params.abortSignal,
      downloadCallback,
      headers: params.headers
    });

    return changesetWithPath;
  }

  private async downloadChangesetFileWithRetry(params: DownloadChangesetFileWithRetryParams): Promise<void> {
    const targetFilePath = params.changeset.filePath;
    if (await this.isChangesetAlreadyDownloaded(targetFilePath, params.changeset.fileSize))
      return;

    const downloadParams: Omit<DownloadFileParams, "url"> = {
      storage: this._options.cloudStorage,
      localPath: targetFilePath,
      abortSignal: params.abortSignal
    };

    let bytesDownloaded = 0;
    if (params.downloadCallback) {
      downloadParams.latestDownloadedChunkSizeCallback = (downloaded) => {
        bytesDownloaded += downloaded;
        params.downloadCallback?.(downloaded);
      };
    }

    try {
      const downloadLink = params.changeset._links.download;
      assertLink(downloadLink);
      await downloadFile({
        ...downloadParams,
        url: downloadLink.href
      });
    } catch (error) {
      this.throwIfAbortError(error, params.changeset);
      params.firstDownloadFailedCallback?.(bytesDownloaded);

      const changeset = await this.querySingleInternal({
        authorization: params.authorization,
        iModelId: params.iModelId,
        changesetId: params.changeset.id,
        headers: params.headers
      });

      try {
        const newDownloadLink = changeset._links.download;
        assertLink(newDownloadLink);
        await downloadFile({
          ...downloadParams,
          url: newDownloadLink.href
        });
      } catch (errorAfterRetry) {
        this.throwIfAbortError(error, params.changeset);

        throw new IModelsErrorImpl({
          code: IModelsErrorCode.ChangesetDownloadFailed,
          message: `Failed to download changeset. Changeset id: ${params.changeset.id}, changeset index: ${params.changeset.index}, error: ${JSON.stringify(errorAfterRetry)}.`
        });
      }
    }
  }

  private async isChangesetAlreadyDownloaded(targetFilePath: string, expectedFileSize: number): Promise<boolean> {
    const fileExists = await this._options.localFileSystem.fileExists(targetFilePath);
    if (!fileExists)
      return false;

    const existingFileSize = await this._options.localFileSystem.getFileSize(targetFilePath);
    if (existingFileSize === expectedFileSize)
      return true;

    await this._options.localFileSystem.deleteFile(targetFilePath);
    return false;
  }

  private createFileName(changesetId: string): string {
    return `${changesetId}.cs`;
  }

  private async provideDownloadCallbacks(params: DownloadChangesetListParams): Promise<[DownloadCallback, DownloadFailedCallback] | undefined> {
    if (!params.progressCallback)
      return;

    let totalSize = 0;
    let totalDownloaded = 0;

    for await (const changesetPage of this.getMinimalList(params).byPage()){
      for (const changeset of changesetPage){
        totalSize += changeset.fileSize;

        const filePath = path.join(params.targetDirectoryPath, this.createFileName(changeset.id));
        if (await this.isChangesetAlreadyDownloaded(filePath, changeset.fileSize))
          totalDownloaded += changeset.fileSize;
      }
    }

    const progressCallback: DownloadCallback = (downloaded) => {
      totalDownloaded += downloaded;
      params.progressCallback?.(totalDownloaded, totalSize);
    };
    // We increase total size to prevent cases where downloaded size is larger than total size at the end of the download.
    const downloadFailedCallback: DownloadCallback = (downloadedBeforeFailure) => totalSize += downloadedBeforeFailure;

    return [progressCallback, downloadFailedCallback];
  }

  private throwIfAbortError(error: unknown, changeset: Changeset) {
    if (!isIModelsApiError(error) || error.code !== IModelsErrorCode.DownloadAborted)
      return;

    error.message = `Changeset(s) download was aborted. Changeset id: ${changeset.id}}.`;
    throw error;
  }
}
