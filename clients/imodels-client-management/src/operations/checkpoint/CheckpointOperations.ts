/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Checkpoint, CheckpointResponse, OperationsBase } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetSingleCheckpointParams } from "./CheckpointOperationParams";

export class CheckpointOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public async getSingle(params: GetSingleCheckpointParams): Promise<Checkpoint> {
    const { authorization, iModelId, ...parentEntityId } = params;
    const response = await this.sendGetRequest<CheckpointResponse>({
      authorization,
      url: this._options.urlFormatter.getCheckpointUrl({ iModelId, ...parentEntityId })
    });
    return response.checkpoint;
  }
}
