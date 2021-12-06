/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelScopedOperationParams } from "@itwin/imodels-client-management";

export interface BriefcaseProperties {
  deviceName: string;
}

export interface AcquireBriefcaseParams extends IModelScopedOperationParams {
  briefcaseProperties?: BriefcaseProperties;
}

export interface ReleaseBriefcaseParams extends IModelScopedOperationParams {
  briefcaseId: number;
}
