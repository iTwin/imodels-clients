/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetResponse, ChangesetState, ChangesetOperations as ManagementChangesetOperations, RecursiveRequired, iModelScopedOperationParams, iModelsErrorCode, iModelsErrorImpl } from "@itwin/imodels-client-management";
import { DownloadedFileProps, FileHandler, FileTransferStatus } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateChangesetParams, DownloadChangesetsParams } from "./ChangesetOperationParams";

class LimitedParallelQueue {
  private _queue: Array<() => Promise<void>> = [];
  private _maxParallelPromises;

  constructor(config: { maxParallelPromises: number }) {
    this._maxParallelPromises = config.maxParallelPromises;
  }

  public push(item: () => Promise<void>): void {
    this._queue.push(item);
  }

  public async waitAll(): Promise<void> {
    const currentlyExecutingPromises = new Array<Promise<void>>();
    while (this._queue.length !== 0 || currentlyExecutingPromises.length !== 0) {
      while (this._queue.length !== 0 && currentlyExecutingPromises.length < this._maxParallelPromises) {
        // We create a promise that removes itself from the `currentlyExecutingPromises` queue after it resolves.
        const executingItem = this._queue.shift()().then(() => {
          const indexOfItemInQueue = currentlyExecutingPromises.indexOf(executingItem);
          currentlyExecutingPromises.splice(indexOfItemInQueue, 1);
        });
        currentlyExecutingPromises.push(executingItem);
      }
      await Promise.race(currentlyExecutingPromises);
    }
  }
}

export class ChangesetOperations extends ManagementChangesetOperations {
  private _fileHandler: FileHandler;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    super(options);
    this._fileHandler = options.fileHandler;
  }

  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const { changesetFilePath, ...changesetProperties } = params.changesetProperties;
    const changesetCreateResponse = await this.sendPostRequest<ChangesetResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets`,
      body: {
        ...changesetProperties,
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

  public async download(params: DownloadChangesetsParams): Promise<(Changeset & DownloadedFileProps)[]> {
    const result: (Changeset & DownloadedFileProps)[] = [];

    this._fileHandler.createDirectory(params.targetDirectoryPath);

    for await (const changesetPage of this.getRepresentationListInPages(params)) {
      // We sort the changesets by fileSize in descending order to download small
      // changesets first because their SAS tokens have a shorter lifespan.
      changesetPage.sort((changeset1, changeset2) => changeset1.fileSize - changeset2.fileSize);

      const queue = new LimitedParallelQueue({ maxParallelPromises: 10 });
      for (const changeset of changesetPage) {
        const targetFilePath = this._fileHandler.join(params.targetDirectoryPath, this.createFileName(changeset.id));
        queue.push(() => this.downloadChangesetWithRetry({
          requestContext: params.requestContext,
          imodelId: params.imodelId,
          changeset,
          targetFilePath: targetFilePath
        }));
        result.push({ ...changeset, downloadedFilePath: targetFilePath });
      }
      await queue.waitAll();
    }

    return result;
  }

  private async downloadChangesetWithRetry(params: { changeset: Changeset, targetFilePath: string } & iModelScopedOperationParams): Promise<void> { // TODO: not sure about signature
    if (this.isChangesetAlreadyDownloaded(params.targetFilePath, params.changeset.fileSize))
      return;

    let downloadUrl = params.changeset._links.download.href;
    let fileDownloadStatus = await this._fileHandler.downloadFile(downloadUrl, params.targetFilePath);

    if (fileDownloadStatus === FileTransferStatus.IntermittentFailure) {
      const changeset = await this.getById({
        requestContext: params.requestContext,
        imodelId: params.imodelId,
        changesetId: params.changeset.id
      });
      downloadUrl = changeset._links.download.href;
      fileDownloadStatus = await this._fileHandler.downloadFile(downloadUrl, params.targetFilePath);
    }

    if (fileDownloadStatus !== FileTransferStatus.Success)
      throw new iModelsErrorImpl({
        code: iModelsErrorCode.ChangesetDownloadFailed,
        message: `Failed to download changeset with status ${fileDownloadStatus}. Changeset id: ${params.changeset.id}, changeset index: ${params.changeset.index}`
      });
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
