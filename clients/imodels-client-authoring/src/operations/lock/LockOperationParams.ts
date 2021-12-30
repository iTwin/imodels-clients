/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "@itwin/imodels-client-management";
import { LockedObjects } from "../../base";

/** Url parameters supported in Lock list query. */
export interface GetLockListUrlParams extends CollectionRequestParams {
  /** Filters Locks for a specific Briefcase. */
  briefcaseId?: number;
}

/** Parameters for get Lock list operation. */
export interface GetLockListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: GetLockListUrlParams;
}

/** Parameters for update Lock operation. */
export interface UpdateLockParams extends IModelScopedOperationParams {
  /** Id of the Briefcase to update Locks for. */
  briefcaseId: number;
  /**
   * Id of the latest Changeset in which the locked object was updated. If this value points to an older Changeset than
   * the value saved in the server acquiring locks will fail. Such state indicates that an object may have been updated
   * and the local Briefcase does not have the latest changes.
   */
  changesetId?: string;
  /** Ids of the locked objects grouped by their lock level. See {@link LockedObjects}. */
  lockedObjects: LockedObjects[];
}
