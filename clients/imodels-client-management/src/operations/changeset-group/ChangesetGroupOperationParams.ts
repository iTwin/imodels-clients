/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "../../base/types/index.js";

/** Url parameters supported in Changeset Group list query. */
export type GetChangesetGroupListUrlParams = CollectionRequestParams;

/** Parameters for get Changeset Group list operation. */
export interface GetChangesetGroupListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: GetChangesetGroupListUrlParams;
}

/** Parameters for get single Changeset Group operation. */
export interface GetSingleChangesetGroupParams extends IModelScopedOperationParams {
  /** Changeset Group id. */
  changesetGroupId: string;
}
