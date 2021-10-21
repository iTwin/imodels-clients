/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetResponse, ChangesetState, ChangesetOperations as ManagementChangesetOperations, RecursiveRequired, iModelScopedOperationParams, iModelsErrorCode, iModelsErrorImpl } from "@itwin/imodels-client-management";
import { DownloadedChangeset, TargetDirectoryParam, FileHandler } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateChangesetParams, DownloadChangesetByIdParams, DownloadChangesetByIndexParams, DownloadChangesetListParams } from "./ChangesetOperationParams";
import { LimitedParallelQueue } from "./LimitedParallelQueue";

export class ChangesetOperations extends ManagementChangesetOperations {
  private _fileHandler: FileHandler;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    super(options);
    this._fileHandler = options.fileHandler;
  }

  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const { filePath: changesetFilePath, ...changesetMetadataProperties } = params.changesetProperties;
    const changesetCreateResponse = await this.sendPostRequest<ChangesetResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets`,
      body: {
        ...changesetMetadataProperties,
        fileSize: this._fileHandler.getFileSize(changesetFilePath)
      }
    });

    const uploadUrl = changesetCreateResponse.changeset._links.upload.href;
    await this._fileHandler.uploadFile(uploadUrl, changesetFilePath);

    const completeUrl = changesetCreateResponse.changeset._links.complete.href;
    const changesetUpdateResponse = await this.sendPatchRequest<ChangesetResponse>({
      requestContext: params.requestContext,
      url: completeUrl,
      body: {
        state: ChangesetState.FileUploaded,
        briefcaseId: params.changesetProperties.briefcaseId
      }
    });
    return changesetUpdateResponse.changeset;
  }

  public async downloadById(params: DownloadChangesetByIdParams): Promise<DownloadedChangeset> {
    const changeset: Changeset = await this.getById(params);
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadByIndex(params: DownloadChangesetByIndexParams): Promise<DownloadedChangeset> {
    const changeset: Changeset = await this.getByIndex(params);
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]> {
    let result: DownloadedChangeset[] = [];

    this._fileHandler.createDirectory(params.targetDirectoryPath);

    for await (const changesetPage of this.getRepresentationListInPages(params)) {
      const changesetsWithFilePath: DownloadedChangeset[] = changesetPage.map(
        (changeset: Changeset) => ({
          ...changeset,
          filePath: this._fileHandler.join(params.targetDirectoryPath, this.createFileName(changeset.id))
        }));
      result = result.concat(changesetsWithFilePath);

      // We sort the changesets by fileSize in descending order to download small
      // changesets first because their SAS tokens have a shorter lifespan.
      changesetsWithFilePath.sort((changeset1: Changeset, changeset2: Changeset) => changeset1.fileSize - changeset2.fileSize);

      const queue = new LimitedParallelQueue({ maxParallelPromises: 10 });
      for (const changeset of changesetsWithFilePath)
        queue.push(() => this.downloadChangesetFileWithRetry({
          requestContext: params.requestContext,
          imodelId: params.imodelId,
          changeset
        }));
      await queue.waitAll();
    }

    return result;
  }

  private async downloadSingleChangeset(params: iModelScopedOperationParams & TargetDirectoryParam & { changeset: Changeset }): Promise<DownloadedChangeset> {
    const changesetWithPath: DownloadedChangeset = {
      ...params.changeset,
      filePath: this._fileHandler.join(params.targetDirectoryPath, this.createFileName(params.changeset.id))
    };

    await this.downloadChangesetFileWithRetry({
      requestContext: params.requestContext,
      imodelId: params.imodelId,
      changeset: changesetWithPath
    });

    return changesetWithPath;
  }

  private async downloadChangesetFileWithRetry(params: iModelScopedOperationParams & { changeset: DownloadedChangeset }): Promise<void> {
    const targetFilePath = params.changeset.filePath;
    if (this.isChangesetAlreadyDownloaded(targetFilePath, params.changeset.fileSize))
      return;

    try {
      await this._fileHandler.downloadFile(params.changeset._links.download.href, targetFilePath);
    } catch (error) {
      const changeset = await this.getById({
        requestContext: params.requestContext,
        imodelId: params.imodelId,
        changesetId: params.changeset.id
      });

      try {
        await this._fileHandler.downloadFile(changeset._links.download.href, targetFilePath);
      } catch (errorAfterRetry) {
        throw new iModelsErrorImpl({
          code: iModelsErrorCode.ChangesetDownloadFailed,
          message: `Failed to download changeset. Changeset id: ${params.changeset.id}, changeset index: ${params.changeset.index}, error: ${JSON.stringify(errorAfterRetry)}.`
        });
      }
    }
  }

  private isChangesetAlreadyDownloaded(targetFilePath: string, expectedFileSize: number): boolean {
    if (!this._fileHandler.exists(targetFilePath))
      return false;

    const existingFileSize = this._fileHandler.getFileSize(targetFilePath);
    if (existingFileSize === expectedFileSize)
      return true;

    this._fileHandler.unlink(targetFilePath);
    return false;
  }

  private createFileName(changesetId: string): string {
    return `${changesetId}.cs`;
  }
}
