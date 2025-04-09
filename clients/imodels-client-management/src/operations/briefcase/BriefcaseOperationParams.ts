/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, IModelScopedOperationParams, OrderableCollectionRequestParams } from "../../base/types/index.js";

/** Special value to indicate the id of current user who is making the request. */
export const SPECIAL_VALUES_ME = "me";

/**
 * Valid owner id values are:
 * - `me` keyword, which specifies to reference the current user. Current user is the user that the access token used for request belongs to;
 * - User id.
 */
export type ValidOwnerIdValue = string;

/**
 * Briefcase entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum BriefcaseOrderByProperty {
  AcquiredDateTime = "acquiredDateTime"
}

/** Url parameters supported in Briefcase list query. */
export interface GetBriefcaseListUrlParams extends OrderableCollectionRequestParams<Briefcase, BriefcaseOrderByProperty> {
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
