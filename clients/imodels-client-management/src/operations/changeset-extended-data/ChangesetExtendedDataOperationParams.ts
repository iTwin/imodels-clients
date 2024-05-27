/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "../../base/types";
import { ChangesetIdOrIndex } from "../OperationParamExports";

/** Url parameters supported in Changeset Extended Data list query. */
export type GetChangesetExtendedDataListUrlParams = CollectionRequestParams;

/** Parameters for get Changeset Extended Data list operation. */
export interface GetChangesetExtendedDataListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: GetChangesetExtendedDataListUrlParams;
}

/** Parameters for get single Changeset Extended Data operation. */
export type GetSingleChangesetExtendedDataParams = IModelScopedOperationParams & ChangesetIdOrIndex;
