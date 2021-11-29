/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, getCollectionIterator } from "@itwin/imodels-client-management";
import { Lock, LockResponse, LocksResponse } from "../../base/interfaces/apiEntities/LockInterfaces";
import { OperationOptions } from "../OperationOptions";
import { GetLockListParams, UpdateLockParams } from "./LockOperationParams";

export class LockOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getList(params: GetLockListParams): AsyncIterableIterator<Lock> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<Lock>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getLockListUrl({ imodelId: params.imodelId, urlParams: params.urlParams }),
      entityCollectionAccessor: (response: unknown) => (response as LocksResponse).locks
    }));
  }

  public async update(params: UpdateLockParams): Promise<Lock> {
    const response = await this.sendPatchRequest<LockResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getLockListUrl({ imodelId: params.imodelId }),
      body: {
        briefcaseId: params.briefcaseId,
        changesetId: params.changesetId,
        lockedObjects: params.lockedObjects
      }
    });
    return response.lock;
  }
}
