/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Checkpoint, CheckpointResponse, OperationsBase } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetSingleCheckpointParams } from "./CheckpointOperationParams";

export class CheckpointOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public async getSingle(params: GetSingleCheckpointParams): Promise<Checkpoint> {
    let parentEntityUrlPath: string | undefined = undefined;
    if (params.changesetId || params.changesetIndex) {
      parentEntityUrlPath = `changesets/${params.changesetId ?? params.changesetIndex}`;
    } else {
      parentEntityUrlPath = `namedversions/${params.namedVersionId}`;
    }

    const response = await this.sendGetRequest<CheckpointResponse>({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}/${params.imodelId}/${parentEntityUrlPath}/checkpoint`
    });
    return response.checkpoint;
  }
}
