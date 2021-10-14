/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelScopedOperationParams, OperationsBase } from "@itwin/imodels-client-management";
import { Checkpoint, CheckpointResponse } from "../../base";
import { GetCheckpointByChangesetIdParams, GetCheckpointByChangesetIndexParams, GetCheckpointByNamedVersionIdParams } from "./CheckpointOperationParams";

export class CheckpointOperations extends OperationsBase {
  public async getByChangesetId(params: GetCheckpointByChangesetIdParams): Promise<Checkpoint> {
    return this.getByParentEntity({
      ...params,
      parentEntityPath: `changesets/${params.changesetId}`
    });
  }

  public async getByChangesetIndex(params: GetCheckpointByChangesetIndexParams): Promise<Checkpoint> {
    return this.getByParentEntity({
      ...params,
      parentEntityPath: `changesets/${params.changesetIndex}`
    });
  }

  public async getByNamedVersionId(params: GetCheckpointByNamedVersionIdParams): Promise<Checkpoint> {
    return this.getByParentEntity({
      ...params,
      parentEntityPath: `namedversions/${params.namedVersionId}`
    });
  }

  private async getByParentEntity(params: iModelScopedOperationParams & { parentEntityPath: string }): Promise<Checkpoint> {
    const response = await this.sendGetRequest<CheckpointResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/${params.parentEntityPath}/checkpoint`
    });
    return response.checkpoint;
  }
}