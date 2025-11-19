/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EntityListIterator,
  EntityListIteratorImpl,
  HttpResponse,
  OperationsBase,
} from "@itwin/imodels-client-management";

import { LockResponse, LocksResponse } from "../../base/internal";
import { Lock, LockedObjects, LockLevel } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetLockListParams, UpdateLockParams } from "./LockOperationParams";

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
    // iModelHub limits the number of object IDs that can be processed in a single lock update request to 1000, so we must batch requests
    // If the total number of object IDs is less than or equal to 1000, a single batch will be created
    const batches: UpdateLockParams[] = this.createBatches(params);

    // Send requests for all batches in parallel
    const updateLockPromises: Promise<HttpResponse<LockResponse>>[] = [];
    for (const batch of batches) {
      const updateLockBody = this.getUpdateLockBody(batch);
      const updateLockPromise: Promise<HttpResponse<LockResponse>> =
        this.sendPatchRequest<LockResponse>({
          authorization: batch.authorization,
          url: this._options.urlFormatter.getLockListUrl({
            iModelId: batch.iModelId,
          }),
          body: updateLockBody,
          headers: batch.headers,
        });
      updateLockPromises.push(updateLockPromise);
    }
    const responses = await Promise.allSettled(updateLockPromises);

    // Collect successful locks
    const locks: Lock[] = [];
    const failures: unknown[] = [];
    for (const response of responses) {
      if (response.status === "fulfilled") {
        locks.push(response.value.body.lock);
      } else {
        failures.push(response.reason);
      }
    }

    // If any failed, we must release all successful locks
    if (failures.length > 0) {
      if (locks.length > 0) {
        const releaseLockParams: UpdateLockParams[] = [];
        for (const lock of locks) {
          // Gather all object Ids that need to be released
          const objectIdsToRelease: string[] = [];
          for (const lockedObjects of lock.lockedObjects) {
            objectIdsToRelease.push(...lockedObjects.objectIds);
          }
          // Create a request to release those ids
          releaseLockParams.push({
            ...params,
            lockedObjects: [
              {
                lockLevel: LockLevel.None,
                objectIds: objectIdsToRelease,
              },
            ],
          });
        }
        // Send release requests in parallel
        const releaseLockPromises: Promise<HttpResponse<LockResponse>>[] = [];
        for (const batch of releaseLockParams) {
          const releaseLockBody = this.getUpdateLockBody(batch);
          const releaseLockPromise: Promise<HttpResponse<LockResponse>> =
            this.sendPatchRequest<LockResponse>({
              authorization: batch.authorization,
              url: this._options.urlFormatter.getLockListUrl({
                iModelId: batch.iModelId,
              }),
              body: releaseLockBody,
              headers: batch.headers,
            });
          releaseLockPromises.push(releaseLockPromise);
        }
        // Let them all complete, will throw if any fail
        await Promise.all(releaseLockPromises);
      }
      // Throw the first failure
      throw failures[0];
    }

    // Merge all successful locks into one
    return this.mergeLocks(locks);
  }

  /**
   * Separates UpdateLockParams into batches when the total number of object IDs exceeds 1000.
   * @param {UpdateLockParams} params parameters to be divided into batches.
   * @param {number} [batchSize=1000] maximum number of object IDs per batch. Defaults to 1000.
   * @returns {UpdateLockParams[]} separated batches of UpdateLockParams
   */
  private createBatches(
    params: UpdateLockParams,
    batchSize: number = 1000
  ): UpdateLockParams[] {
    if (batchSize <= 0) {
      throw new Error("Batch size must be a positive integer");
    }

    const batches: UpdateLockParams[] = [];
    let currentBatch: LockedObjects[] = [];
    let remainingSpaceInBatch = batchSize;

    // Work through each group of locked objects
    for (const lockedObjects of params.lockedObjects) {
      let objectIds = lockedObjects.objectIds;
      while (objectIds.length > 0) {
        // Fill the current batch
        const objectIdsToBatch = objectIds.slice(
          0,
          Math.min(remainingSpaceInBatch, objectIds.length)
        );
        // Remove the batched object IDs from the original list
        objectIds = objectIds.slice(
          Math.min(remainingSpaceInBatch, objectIds.length)
        );
        remainingSpaceInBatch -= objectIdsToBatch.length;
        currentBatch.push({
          lockLevel: lockedObjects.lockLevel,
          objectIds: objectIdsToBatch,
        });

        // If the current batch is full, push it to batches and reset
        if (remainingSpaceInBatch === 0) {
          batches.push({
            ...params,
            lockedObjects: currentBatch,
          });
          currentBatch = [];
          remainingSpaceInBatch = batchSize;
        }
      }
    }
    // Add the remaining objects as the final batch
    if (currentBatch.length > 0) {
      batches.push({
        ...params,
        lockedObjects: currentBatch,
      });
    }
    return batches;
  }

  /**
   * Merges multiple Lock objects into a single Lock object.
   * @param {Lock[]} locks array of Lock objects to be merged.
   * @returns {Lock} merged Lock object.
   */
  private mergeLocks(locks: Lock[]): Lock {
    if (locks.length === 0) {
      throw new Error("No locks to merge");
    }

    const mergedLock: Lock = {
      briefcaseId: locks[0].briefcaseId,
      lockedObjects: [],
    };

    // Merge each lock into the merged lock
    for (const lock of locks) {
      if (lock.briefcaseId !== mergedLock.briefcaseId) {
        throw new Error("Cannot merge locks from different briefcases");
      }

      for (const lockedObjectsByLevel of lock.lockedObjects) {
        let existingLockLevel = false;
        // Check if a matching lock level already exists in the merged lock
        for (const mergedLockedObjectsByLevel of mergedLock.lockedObjects) {
          if (
            lockedObjectsByLevel.lockLevel ===
            mergedLockedObjectsByLevel.lockLevel
          ) {
            mergedLockedObjectsByLevel.objectIds.push(
              ...lockedObjectsByLevel.objectIds
            );
            existingLockLevel = true;
            break;
          }
        }
        // If no matching lock level exists, add the locked objects to the merged lock
        if (!existingLockLevel) {
          mergedLock.lockedObjects.push(lockedObjectsByLevel);
        }
      }
    }

    return mergedLock;
  }

  private getUpdateLockBody(params: UpdateLockParams): object {
    return {
      briefcaseId: params.briefcaseId,
      changesetId: params.changesetId,
      lockedObjects: params.lockedObjects,
    };
  }
}
