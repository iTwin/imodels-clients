/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetResponse, ChangesetState, ChangesetOperations as ManagementChangesetOperations, iModelScopedOperationParams, iModelsErrorCode, iModelsErrorImpl } from "@itwin/imodels-client-management";
import { DownloadedChangeset, TargetDirectoryParam } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateChangesetParams, DownloadChangesetByIdParams, DownloadChangesetByIndexParams, DownloadChangesetListParams } from "./ChangesetOperationParams";
import { LimitedParallelQueue } from "./LimitedParallelQueue";

export class ChangesetOperations<TOptions extends OperationOptions> extends ManagementChangesetOperations<TOptions>{
  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const { filePath: changesetFilePath, ...changesetMetadataProperties } = params.changesetProperties;
    const changesetCreateResponse = await this.sendPostRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetsUrl(params),
      body: {
        ...changesetMetadataProperties,
        fileSize: this._options.fileHandler.getFileSize(changesetFilePath)
      }
    });

    const uploadUrl = changesetCreateResponse.changeset._links.upload.href;
    await this._options.fileHandler.uploadFile({ uploadUrl, sourceFilePath: changesetFilePath });

    const completeUrl = changesetCreateResponse.changeset._links.complete.href;
    const changesetUpdateResponse = await this.sendPatchRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: completeUrl,
      body: {
        state: ChangesetState.FileUploaded,
        briefcaseId: params.changesetProperties.briefcaseId
      }
    });

    return changesetUpdateResponse.changeset;
  }

  public async downloadById(params: DownloadChangesetByIdParams): Promise<DownloadedChangeset> {
    const changeset: Changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetId });
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadByIndex(params: DownloadChangesetByIndexParams): Promise<DownloadedChangeset> {
    const changeset: Changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetIndex });
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]> {
    let result: DownloadedChangeset[] = [];

    this._options.fileHandler.createDirectory(params.targetDirectoryPath);

    for await (const changesetPage of this.getRepresentationListInternal(params)) {
      const changesetsWithFilePath: DownloadedChangeset[] = changesetPage.map(
        (changeset: Changeset) => ({
          ...changeset,
          filePath: this._options.fileHandler.join(params.targetDirectoryPath, this.createFileName(changeset.id))
        }));
      result = result.concat(changesetsWithFilePath);

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

    return result;
  }

  private async downloadSingleChangeset(params: iModelScopedOperationParams & TargetDirectoryParam & { changeset: Changeset }): Promise<DownloadedChangeset> {
    const changesetWithPath: DownloadedChangeset = {
      ...params.changeset,
      filePath: this._options.fileHandler.join(params.targetDirectoryPath, this.createFileName(params.changeset.id))
    };

    await this.downloadChangesetFileWithRetry({
      authorization: params.authorization,
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
      await this._options.fileHandler.downloadFile({ downloadUrl: params.changeset._links.download.href, targetFilePath });
    } catch (error) {
      const changeset = await this.getByIdOrIndexInternal({
        authorization: params.authorization,
        imodelId: params.imodelId,
        changesetIdOrIndex: params.changeset.id
      });

      try {
        await this._options.fileHandler.downloadFile({ downloadUrl: changeset._links.download.href, targetFilePath });
      } catch (errorAfterRetry) {
        throw new iModelsErrorImpl({
          code: iModelsErrorCode.ChangesetDownloadFailed,
          message: `Failed to download changeset. Changeset id: ${params.changeset.id}, changeset index: ${params.changeset.index}, error: ${JSON.stringify(errorAfterRetry)}.`
        });
      }
    }
  }

  private isChangesetAlreadyDownloaded(targetFilePath: string, expectedFileSize: number): boolean {
    if (!this._options.fileHandler.exists(targetFilePath))
      return false;

    const existingFileSize = this._options.fileHandler.getFileSize(targetFilePath);
    if (existingFileSize === expectedFileSize)
      return true;

    this._options.fileHandler.unlink(targetFilePath);
    return false;
  }

  private createFileName(changesetId: string): string {
    return `${changesetId}.cs`;
  }
}
