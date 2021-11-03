/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetResponseApiModel, ChangesetState, ChangesetOperations as ManagementChangesetOperations, RecursiveRequired, iModelScopedOperationParams, iModelsErrorCode, iModelsErrorImpl, ChangesetApiModel, CheckpointOperations } from "@itwin/imodels-client-management";
import { DownloadedChangeset, DownloadedFileProps, FileHandler, TargetDirectoryParam } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateChangesetParams, DownloadChangesetByIdParams, DownloadChangesetByIndexParams, DownloadChangesetListParams } from "./ChangesetOperationParams";
import { LimitedParallelQueue } from "./LimitedParallelQueue";

type ChangesetApiModelWithFilePath = ChangesetApiModel & DownloadedFileProps;

export class ChangesetOperations extends ManagementChangesetOperations {
  private _fileHandler: FileHandler;

  constructor(options: RecursiveRequired<iModelsClientOptions>, checkpointOperations: CheckpointOperations) {
    super(options, checkpointOperations);
    this._fileHandler = options.fileHandler;
  }

  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const { filePath: changesetFilePath, ...changesetMetadataProperties } = params.changesetProperties;
    const changesetCreateResponse = await this.sendPostRequest<ChangesetResponseApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      body: {
        ...changesetMetadataProperties,
        fileSize: this._fileHandler.getFileSize(changesetFilePath)
      }
    });

    const uploadUrl = changesetCreateResponse.changeset._links.upload.href;
    await this._fileHandler.uploadFile(uploadUrl, changesetFilePath);

    const completeUrl = changesetCreateResponse.changeset._links.complete.href;
    const changesetUpdateResponse = await this.sendPatchRequest<ChangesetResponseApiModel>({
      authorization: params.authorization,
      url: completeUrl,
      body: {
        state: ChangesetState.FileUploaded,
        briefcaseId: params.changesetProperties.briefcaseId
      }
    });
    return this.mapChangeset(params.authorization, changesetUpdateResponse.changeset);
  }

  public async downloadById(params: DownloadChangesetByIdParams): Promise<DownloadedChangeset> {
    const changeset: ChangesetApiModel = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetId });
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadByIndex(params: DownloadChangesetByIndexParams): Promise<DownloadedChangeset> {
    const changeset: ChangesetApiModel = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetIndex });
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]> {
    let intermediateResult: ChangesetApiModelWithFilePath[] = [];

    this._fileHandler.createDirectory(params.targetDirectoryPath);

    for await (const changesetPage of this.getRepresentationListIntenal(params)) {
      const changesetsWithFilePath: ChangesetApiModelWithFilePath[] = changesetPage.map(
        (changeset: ChangesetApiModel) => ({
          ...changeset,
          filePath: this._fileHandler.join(params.targetDirectoryPath, this.createFileName(changeset.id))
        }));
      intermediateResult = intermediateResult.concat(changesetsWithFilePath);

      // We sort the changesets by fileSize in descending order to download small
      // changesets first because their SAS tokens have a shorter lifespan.
      changesetsWithFilePath.sort((changeset1: DownloadedChangeset, changeset2: DownloadedChangeset) => changeset1.fileSize - changeset2.fileSize);

      const queue = new LimitedParallelQueue({ maxParallelPromises: 10 });
      for (const changeset of changesetsWithFilePath)
        queue.push(() => this.downloadChangesetFileWithRetry({
          authorization: params.authorization,
          imodelId: params.imodelId,
          changeset
        }));
      await queue.waitAll();
    }

    const result = intermediateResult.map(this.mapDownloadedChangeset);
    return result;
  }

  private async downloadSingleChangeset(params: iModelScopedOperationParams & TargetDirectoryParam & { changeset: ChangesetApiModel }): Promise<ChangesetApiModelWithFilePath> {
    const changesetWithPath: ChangesetApiModelWithFilePath = {
      ...params.changeset,
      filePath: this._fileHandler.join(params.targetDirectoryPath, this.createFileName(params.changeset.id))
    };

    await this.downloadChangesetFileWithRetry({
      authorization: params.authorization,
      imodelId: params.imodelId,
      changeset: changesetWithPath
    });

    return changesetWithPath;
  }

  private async downloadChangesetFileWithRetry(params: iModelScopedOperationParams & { changeset: ChangesetApiModelWithFilePath }): Promise<void> {
    const targetFilePath = params.changeset.filePath;
    if (this.isChangesetAlreadyDownloaded(targetFilePath, params.changeset.fileSize))
      return;

    try {
      await this._fileHandler.downloadFile(params.changeset._links.download.href, targetFilePath);
    } catch (error) {
      const changeset = await this.getByIdOrIndexInternal({
        authorization: params.authorization,
        imodelId: params.imodelId,
        changesetIdOrIndex: params.changeset.id
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

  private mapDownloadedChangeset(changeset: ChangesetApiModel): DownloadedChangeset {
    return changeset as any;
  }

}
