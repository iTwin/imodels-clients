/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CheckpointResponse, OperationsBase } from "../../base/internal";
import { Checkpoint, ContentType } from "../../base/types";
import { GetSingleNamedVersionParams } from "../named-version/NamedVersionOperationParams";
import { OperationOptions } from "../OperationOptions";

import { GetSingleCheckpointParams } from "./CheckpointOperationParams";

export class CheckpointOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Gets a single Checkpoint generated either on a specific Changeset or for a specific Named Version. This method
   * returns a Checkpoint in its full representation. Wraps
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-changeset-checkpoint/ Get Changeset Checkpoint},
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-named-version-checkpoint/ Get Named Version Checkpoint} and
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-briefcase-checkpoint/ Get Briefcase Checkpoint}
   * operations from iModels API.
   * @param {GetSingleCheckpointParams} params parameters for this operation. See {@link GetSingleCheckpointParams}.
   * @returns {Promise<Checkpoint>} a Checkpoint for the specified parent entity. See {@link Checkpoint}.
   */
  public async getSingle(
    params: GetSingleCheckpointParams
  ): Promise<Checkpoint> {
    const { authorization, iModelId, headers, ...parentEntityId } = params;
    const response = await this.sendGetRequest<CheckpointResponse>({
      authorization,
      url: this._options.urlFormatter.getCheckpointUrl({
        iModelId,
        ...parentEntityId,
      }),
      headers,
    });
    return response.body.checkpoint;
  }

  /**
   * Reschedules failed Named Version Checkpoint. This method
   * returns a Checkpoint in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/update-named-version-checkpoint/
   * Update Named Version Checkpoint} operation from iModels API.
   * @param {GetSingleNamedVersionParams} params parameters for this operation. See {@link GetSingleNamedVersionParams}.
   * @returns {Promise<Checkpoint>} a Checkpoint for the specified parent entity. See {@link Checkpoint}.
   */
  public async updateNamedVersionCheckpoint(
    params: GetSingleNamedVersionParams
  ): Promise<Checkpoint> {
    const response = await this.sendPutRequest<CheckpointResponse>({
          authorization: params.authorization,
          url: this._options.urlFormatter.getCheckpointUrl({
            iModelId: params.iModelId,
            namedVersionId: params.namedVersionId,
          }),   
          headers: params.headers,
          body: new Uint8Array(),
          contentType: ContentType.Png
        });
    return response.body.checkpoint;
  }
}
