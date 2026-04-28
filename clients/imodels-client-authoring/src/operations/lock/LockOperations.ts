/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Lock,
  LockResponse,
  LockOperations as ManagementLockOperations,
} from "@itwin/imodels-client-management";

import { OperationOptions } from "../OperationOptions";

import { UpdateLockParams } from "./LockOperationParams";

export class LockOperations<
  TOptions extends OperationOptions,
> extends ManagementLockOperations<TOptions> {
  /**
   * Updates Lock for a specific Briefcase. This operation is used to acquire new locks and change the lock level for
   * already existing ones. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/update-imodel-locks/
   * Update iModel Locks} operation from iModels API.
   * @param {UpdateLockParams} params parameters for this operation. See {@link UpdateLockParams}.
   * @returns {Promise<Lock>} updated Lock. See {@link Lock}.
   */
  public async update(params: UpdateLockParams): Promise<Lock> {
    const updateLockBody = this.getUpdateLockBody(params);
    const updateLockResponse = await this.sendPatchRequest<LockResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getLockListUrl({
        iModelId: params.iModelId,
      }),
      body: updateLockBody,
      headers: params.headers,
    });
    return updateLockResponse.body.lock;
  }

  private getUpdateLockBody(params: UpdateLockParams): object {
    return {
      briefcaseId: params.briefcaseId,
      changesetId: params.changesetId,
      lockedObjects: params.lockedObjects,
    };
  }
}
