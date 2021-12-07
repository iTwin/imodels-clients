/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "@itwin/imodels-client-management";
import { LockedObjects } from "../../base";

export interface GetLockListUrlParams extends CollectionRequestParams {
  briefcaseId?: number;
}

export interface GetLockListParams extends IModelScopedOperationParams {
  urlParams?: GetLockListUrlParams;
}

export interface UpdateLockParams extends IModelScopedOperationParams {
  briefcaseId: number;
  changesetId?: string;
  lockedObjects: LockedObjects[];
}
