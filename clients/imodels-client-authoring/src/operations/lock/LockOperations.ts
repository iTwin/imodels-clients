/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { getCollectionIterator, OperationsBase } from "@itwin/imodels-client-management";
import { Lock, LockResponse, LocksResponse } from "../../base/interfaces/apiEntities/LockInterfaces";
import { OperationOptions } from "../OperationOptions";
import { GetLockListParams, UpdateLockParams } from "./LockOperationParams";

export class LockOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getList(params: GetLockListParams): AsyncIterableIterator<Lock> {
    return getCollectionIterator(() => this.getEntityCollectionPage<Lock>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getLocksUrl(params),
      entityCollectionAccessor: (response: unknown) => (response as LocksResponse).locks
    }));
  }

  public async update(params: UpdateLockParams): Promise<Lock> {
    const { authorization, imodelId, ...lockProperties } = params;
    const response = await this.sendPostRequest<LockResponse>({
      authorization,
      url: this._options.urlFormatter.getLockUrl(params),
      body: lockProperties
    });
    return response.lock;
  }
}
