/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EntityListIteratorImpl,
  LocksResponse,
  ReleaseLocksChunkResponse,
} from "../../base/internal";
import { OperationsBase } from "../../base/internal";
import {
  EntityListIterator,
  Lock,
  ReleaseLocksChunkResult,
} from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import {
  GetLockListParams,
  ReleaseLocksChunkParams,
} from "./LockOperationParams";

export class LockOperations<
  TOptions extends OperationOptions,
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
      }),
    );
  }

  /**
   * Releases Locks chunk for a specific Briefcase. This operation is used to release or abandon existing Locks.
   * Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/release-imodel-locks-chunk/
   * Release iModel Locks Chunk} operation from iModels API.
   * @param {ReleaseLocksChunkParams} params parameters for this operation. See {@link ReleaseLocksChunkParams}.
   * @returns {Promise<ReleaseLocksChunkResult>} result indicating if this was the last chunk. See {@link ReleaseLocksChunkResult}.
   */
  public async releaseLocksChunk(
    params: ReleaseLocksChunkParams,
  ): Promise<ReleaseLocksChunkResult> {
    const releaseLocksChunkResponse =
      await this.sendPostRequest<ReleaseLocksChunkResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getReleaseLocksChunkUrl({
          iModelId: params.iModelId,
        }),
        body: {
          briefcaseId: params.briefcaseId,
          changesetId: params.changesetId,
        },
        headers: params.headers,
      });
    return releaseLocksChunkResponse.body;
  }
}
