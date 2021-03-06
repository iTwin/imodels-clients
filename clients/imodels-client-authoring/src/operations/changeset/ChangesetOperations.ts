/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

import { ChangesetResponse, IModelsErrorImpl } from "@itwin/imodels-client-management/lib/base/internal";
import { ChangesetOperations as ManagementChangesetOperations } from "@itwin/imodels-client-management/lib/operations";

import { Changeset, ChangesetState, IModelScopedOperationParams, IModelsErrorCode } from "@itwin/imodels-client-management";

import { DownloadedChangeset, TargetDirectoryParam } from "../../base/public";
import { assertLink } from "../CommonFunctions";
import { OperationOptions } from "../OperationOptions";

import { ChangesetPropertiesForCreate, CreateChangesetParams, DownloadChangesetListParams, DownloadSingleChangesetParams } from "./ChangesetOperationParams";
import { LimitedParallelQueue } from "./LimitedParallelQueue";

export class ChangesetOperations<TOptions extends OperationOptions> extends ManagementChangesetOperations<TOptions>{
  /**
   * Creates a Changeset. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/create-imodel-changeset/
   * Create iModel Changeset} operation from iModels API. Internally it creates a Changeset instance, uploads the Changeset
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
      body: createChangesetBody
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
      body: confirmUploadBody
    });

    const result = this.appendRelatedEntityCallbacks(params.authorization, confirmUploadResponse.changeset);
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
          changeset
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
      synchronizationInfo: changesetProperties.synchronizationInfo
    };
  }

  private getConfirmUploadRequestBody(changesetProperties: ChangesetPropertiesForCreate): object {
    return {
      state: ChangesetState.FileUploaded,
      briefcaseId: changesetProperties.briefcaseId
    };
  }

  private async downloadSingleChangeset(params: IModelScopedOperationParams & TargetDirectoryParam & { changeset: Changeset }): Promise<DownloadedChangeset> {
    const changesetWithPath: DownloadedChangeset = {
      ...params.changeset,
      filePath: path.join(params.targetDirectoryPath, this.createFileName(params.changeset.id))
    };

    await this.downloadChangesetFileWithRetry({
      authorization: params.authorization,
      iModelId: params.iModelId,
      changeset: changesetWithPath
    });

    return changesetWithPath;
  }

  private async downloadChangesetFileWithRetry(params: IModelScopedOperationParams & { changeset: DownloadedChangeset }): Promise<void> {
    const targetFilePath = params.changeset.filePath;
    if (await this.isChangesetAlreadyDownloaded(targetFilePath, params.changeset.fileSize))
      return;

    try {
      const downloadLink = params.changeset._links.download;
      assertLink(downloadLink);
      await this._options.cloudStorage.download({
        transferType: "local",
        url: downloadLink.href,
        localPath: targetFilePath
      });
    } catch (error) {
      const changeset = await this.querySingleInternal({
        authorization: params.authorization,
        iModelId: params.iModelId,
        changesetId: params.changeset.id
      });

      try {
        const newDownloadLink = changeset._links.download;
        assertLink(newDownloadLink);
        await this._options.cloudStorage.download({
          transferType: "local",
          url: newDownloadLink.href,
          localPath: targetFilePath
        });
      } catch (errorAfterRetry) {
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
}
