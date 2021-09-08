/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetOperations as ManagementChangesetOperations, Changeset, ChangesetState, ChangesetResponse, RecursiveRequired } from "@itwin/imodels-client-management";
import { ChangesetCreateResponse, FileHandler } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateChangesetParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends ManagementChangesetOperations {
  private _fileHandler: FileHandler;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    super(options);
    this._fileHandler = options.fileHandler;
  }

  public async create(params: CreateChangesetParams): Promise<Changeset> {
    const { changesetFilePath, ...changesetProperties } = params.changesetProperties;
    const changesetCreateResponse = await this.sendPostRequest<ChangesetCreateResponse>({
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
}
