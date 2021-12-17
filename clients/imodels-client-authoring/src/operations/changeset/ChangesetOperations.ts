/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetResponse, ChangesetState, IModelScopedOperationParams, IModelsErrorCode, IModelsErrorImpl, ChangesetOperations as ManagementChangesetOperations } from "@itwin/imodels-client-management";
import { DownloadedChangeset, TargetDirectoryParam } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { ChangesetPropertiesForCreate, CreateChangesetParams, DownloadChangesetListParams, DownloadSingleChangesetParams } from "./ChangesetOperationParams";
import { LimitedParallelQueue } from "./LimitedParallelQueue";

export class ChangesetOperations<TOptions extends OperationOptions> extends ManagementChangesetOperations<TOptions>{
  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const createChangesetBody = this.getCreateChangesetRequestBody(params.changesetProperties);
    const createChangesetResponse = await this.sendPostRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetListUrl({ iModelId: params.iModelId }),
      body: createChangesetBody
    });

    const uploadUrl = createChangesetResponse.changeset._links.upload.href;
    await this._options.fileHandler.uploadFile({ uploadUrl, sourceFilePath: params.changesetProperties.filePath });

    const confirmUploadBody = this.getConfirmUploadRequestBody(params.changesetProperties);
    const confirmUploadResponse = await this.sendPatchRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: createChangesetResponse.changeset._links.complete.href,
      body: confirmUploadBody
    });

    return confirmUploadResponse.changeset;
  }

  public async downloadSingle(params: DownloadSingleChangesetParams): Promise<DownloadedChangeset> {
    const changeset: Changeset = await this.querySingleInternal(params);
    return this.downloadSingleChangeset({ ...params, changeset });
  }

  public async downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]> {
    let result: DownloadedChangeset[] = [];

    this._options.fileHandler.createDirectory(params.targetDirectoryPath);

    for await (const changesetPage of this.getRepresentationList(params).byPage()) {
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
        queue.push(async () => this.downloadChangesetFileWithRetry({
          authorization: params.authorization,
          iModelId: params.iModelId,
          changeset
        }));
      await queue.waitAll();
    }

    return result;
  }

  private getCreateChangesetRequestBody(changesetProperties: ChangesetPropertiesForCreate): object {
    return {
      id: changesetProperties.id,
      description: changesetProperties.description,
      parentId: changesetProperties.parentId,
      briefcaseId: changesetProperties.briefcaseId,
      containingChanges: changesetProperties.containingChanges,
      fileSize: this._options.fileHandler.getFileSize(changesetProperties.filePath)
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
      filePath: this._options.fileHandler.join(params.targetDirectoryPath, this.createFileName(params.changeset.id))
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
    if (this.isChangesetAlreadyDownloaded(targetFilePath, params.changeset.fileSize))
      return;

    try {
      await this._options.fileHandler.downloadFile({ downloadUrl: params.changeset._links.download.href, targetFilePath });
    } catch (error) {
      const changeset = await this.querySingleInternal({
        authorization: params.authorization,
        iModelId: params.iModelId,
        changesetId: params.changeset.id
      });

      try {
        await this._options.fileHandler.downloadFile({ downloadUrl: changeset._links.download.href, targetFilePath });
      } catch (errorAfterRetry) {
        throw new IModelsErrorImpl({
          code: IModelsErrorCode.ChangesetDownloadFailed,
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
