/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Checkpoint, CheckpointResponse, OperationsBase, iModelScopedOperationParams } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetCheckpointByChangesetIdParams, GetCheckpointByChangesetIndexParams, GetCheckpointByNamedVersionIdParams } from "./CheckpointOperationParams";

export class CheckpointOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getByChangesetId(params: GetCheckpointByChangesetIdParams): Promise<Checkpoint> {
    return this.getByParentEntity({
      ...params,
      parentEntityUrlPath: `changesets/${params.changesetId}`
    });
  }

  public getByChangesetIndex(params: GetCheckpointByChangesetIndexParams): Promise<Checkpoint> {
    return this.getByParentEntity({
      ...params,
      parentEntityUrlPath: `changesets/${params.changesetIndex}`
    });
  }

  public getByNamedVersionId(params: GetCheckpointByNamedVersionIdParams): Promise<Checkpoint> {
    return this.getByParentEntity({
      ...params,
      parentEntityUrlPath: `namedversions/${params.namedVersionId}`
    });
  }

  private async getByParentEntity(params: iModelScopedOperationParams & { parentEntityUrlPath: string }): Promise<Checkpoint> {
    const response = await this.sendGetRequest<CheckpointResponse>({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}/${params.imodelId}/${params.parentEntityUrlPath}/checkpoint`
    });
    return response.checkpoint;
  }
}
