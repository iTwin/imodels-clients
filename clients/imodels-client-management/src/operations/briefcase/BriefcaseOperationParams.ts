/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "../../base";

/** Special value to indicate the id of current user who is making the request. */
export const SPECIAL_VALUES_ME = "me";

/**
 * Valid values for Briefcase owner id filter. Currently the only supported value is `me` which allows to query
 * Briefcases owned by the current user making the request.
 */
export type ValidOwnerIdValue = typeof SPECIAL_VALUES_ME;

/** Url parameters supported in Briefcase list query. */
export interface GetBriefcaseListUrlParams extends CollectionRequestParams {
  /** Filters Briefcases with specific owner. See {@link ValidOwnerIdValue}. */
  ownerId?: ValidOwnerIdValue;
}

/** Parameters for get Briefcase list operation. */
export interface GetBriefcaseListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: GetBriefcaseListUrlParams;
}

/** Parameters for get single Briefcase operation. */
export interface GetSingleBriefcaseParams extends IModelScopedOperationParams {
  /** Briefcase id. */
  briefcaseId: number;
}
