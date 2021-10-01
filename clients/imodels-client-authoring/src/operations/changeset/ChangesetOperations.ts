/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetResponse, ChangesetState, ChangesetOperations as ManagementChangesetOperations, RecursiveRequired } from "@itwin/imodels-client-management";
import { DownloadedFileProps, FileHandler } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateChangesetParams, DownloadChangesetsParams } from "./ChangesetOperationParams";

/** Queue for limiting number of promises executed in parallel. */
class ParallelQueue {
  private _queue: Array<() => Promise<void>> = [];
  private _parallelDownloads = 10;

  /** Add a promise to the queue. */
  public push(downloadFunc: () => Promise<void>) {
    this._queue.push(downloadFunc);
  }

  /** Wait for all promises in the queue to finish. */
  public async waitAll() {
    let i = 0;
    const promises = new Array<Promise<number>>();
    const indexes = new Array<number>();
    const completed = new Array<number>();

    while (this._queue.length > 0 || promises.length > 0) {
      while (this._queue.length > 0 && promises.length < this._parallelDownloads) {
        const currentIndex = i++;
        promises.push(this._queue[0]().then(() => completed.push(currentIndex)));
        indexes.push(currentIndex);
        this._queue.shift();
      }
      await Promise.race(promises);
      while (completed.length > 0) {
        const completedIndex = completed.shift()!;
        const index = indexes.findIndex((value) => value === completedIndex);
        if (index !== undefined) {
          promises.splice(index, 1);
          indexes.splice(index, 1);
        }
      }
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

  // TODO: accept range params
  public async download(params: DownloadChangesetsParams): Promise<(Changeset & DownloadedFileProps)[]> {
    const result: (Changeset & DownloadedFileProps)[] = [];

    this._fileHandler.createDirectory(params.targetPath);

    for await (const changesetPage of this.getRepresentationListInPages(params)) {
      const queue = new ParallelQueue();
      for (const changeset of changesetPage) {
        const targetPath = this._fileHandler.join(params.targetPath, this.createFileName(changeset.id));
        queue.push(() => this.downloadChangeset(changeset, targetPath));
      }
      queue.waitAll();
    }

    return result;
  }

  private downloadChangeset(changeset: Changeset, targetPath: string): Promise<void> {
    // TODO: retry downlaod by re-querying the changeset
    const downloadUrl = changeset._links.download.href;
    return this._fileHandler.downloadFile(downloadUrl, targetPath);
  }

  private createFileName(changesetId: string): string {
    return `${changesetId}.cs`;
  }
}
