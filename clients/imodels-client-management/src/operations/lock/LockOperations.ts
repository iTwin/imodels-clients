/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIteratorImpl, LocksResponse } from "../../base/internal";
import { OperationsBase } from "../../base/internal";
import { EntityListIterator, Lock } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetLockListParams } from "./LockOperationParams";

export class LockOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Gets Locks for a specific iModel. This method returns Locks in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-locks/ Get iModel Locks} operation from
   * iModels API.
   * @param {GetLockListParams} params parameters for this operation. See {@link GetLockListParams}.
   * @returns {EntityListIterator<Lock>} iterator for Lock list. See {@link EntityListIterator}, {@link Lock}.
   */
  public getList(params: GetLockListParams): EntityListIterator<Lock> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<Lock, LocksResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getLockListUrl({
          iModelId: params.iModelId,
          urlParams: params.urlParams,
        }),
        entityCollectionAccessor: (response) => response.body.locks,
        headers: params.headers,
      })
    );
  }
}
