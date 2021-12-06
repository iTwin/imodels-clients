/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "../../base";

export const SPECIAL_VALUES_ME = "me";

export type ValidOwnerIdValue = typeof SPECIAL_VALUES_ME;

export interface GetBriefcaseListUrlParams extends CollectionRequestParams {
  ownerId?: ValidOwnerIdValue;
}

export interface GetBriefcaseListParams extends IModelScopedOperationParams {
  urlParams?: GetBriefcaseListUrlParams;
}

export interface GetSingleBriefcaseParams extends IModelScopedOperationParams {
  briefcaseId: number;
}
