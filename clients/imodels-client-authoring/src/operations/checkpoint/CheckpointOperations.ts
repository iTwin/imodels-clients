/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "@itwin/imodels-client-management";
import { Checkpoint, CheckpointResponse } from "../../base/interfaces/apiEntities/CheckpointInterfaces";
import { GetCheckpointByChangesetIdParams, GetCheckpointByChangesetIndexParams, GetCheckpointByNamedVersionIdParams } from "./CheckpointOperationParams";

export class CheckpointOperations extends OperationsBase {
  public async getByChangesetId(params: GetCheckpointByChangesetIdParams): Promise<Checkpoint> {
    const response = await this.sendGetRequest<CheckpointResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetId}/checkpoint`
    });
    return response.checkpoint;
  }

  public async getByChangesetIndex(params: GetCheckpointByChangesetIndexParams): Promise<Checkpoint> {
    const response = await this.sendGetRequest<CheckpointResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetIndex}/checkpoint`
    });
    return response.checkpoint;
  }

  public async getByNamedVersionId(params: GetCheckpointByNamedVersionIdParams): Promise<Checkpoint> {
    const response = await this.sendGetRequest<CheckpointResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/namedversions/${params.namedVersionId}/checkpoint`
    });
    return response.checkpoint;
  }
}