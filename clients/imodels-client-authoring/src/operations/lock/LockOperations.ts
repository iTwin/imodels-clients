/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EntityListIterator,
  EntityListIteratorImpl,
  OperationsBase,
} from "@itwin/imodels-client-management";

import {
  LockResponse,
  LocksResponse,
  ReleaseLocksChunkResponse,
} from "../../base/internal";
import { Lock } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import {
  GetLockListParams,
  UpdateLockParams,
  ReleaseLocksChunkParams,
} from "./LockOperationParams";

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

  /**
   * Releases Locks chunk for a specific Briefcase. This operation is used to release or abandon existing Locks.
   * Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/release-imodel-locks-chunk/
   * Release iModel Locks Chunk} operation from iModels API.
   * @param {ReleaseLocksChunkParams} params parameters for this operation. See {@link ReleaseLocksChunkParams}.
   * @returns {Promise<ReleaseLocksChunkResponse>} response indicating if this was the last chunk. See {@link ReleaseLocksChunkResponse}.
   */
  public async releaseLocksChunk(
    params: ReleaseLocksChunkParams
  ): Promise<ReleaseLocksChunkResponse> {
    const releaseLocksChunkBody = this.getReleaseLocksChunkBody(params);
    const releaseLocksChunkResponse =
      await this.sendPostRequest<ReleaseLocksChunkResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getReleaseLocksChunkUrl({
          iModelId: params.iModelId,
        }),
        body: releaseLocksChunkBody,
        headers: params.headers,
      });
    return releaseLocksChunkResponse.body;
  }

  private getUpdateLockBody(params: UpdateLockParams): object {
    return {
      briefcaseId: params.briefcaseId,
      changesetId: params.changesetId,
      lockedObjects: params.lockedObjects,
    };
  }

  private getReleaseLocksChunkBody(params: ReleaseLocksChunkParams): object {
    return {
      briefcaseId: params.briefcaseId,
      changesetId: params.changesetId,
    };
  }
}
