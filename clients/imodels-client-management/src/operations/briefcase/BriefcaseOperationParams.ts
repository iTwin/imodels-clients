/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, iModelScopedOperationParams } from "../../base";

export interface GetBriefcaseListParams extends iModelScopedOperationParams {
  urlParams?: CollectionRequestParams; // todo: extract
}

export interface GetBriefcaseByIdParams extends iModelScopedOperationParams {
  briefcaseId: number;
}
