/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, iModelScopedOperationParams } from "@itwin/imodels-client-management";
import { LockedObjects } from "../../base";

export interface GetLockListUrlParams extends CollectionRequestParams {
  briefcaseId?: number;
}

export interface GetLockListParams extends iModelScopedOperationParams {
  urlParams?: GetLockListUrlParams;
}

export interface UpdateLockParams extends iModelScopedOperationParams {
  briefcaseId: number;
  changesetId?: string;
  lockedObjects: LockedObjects[];
}
