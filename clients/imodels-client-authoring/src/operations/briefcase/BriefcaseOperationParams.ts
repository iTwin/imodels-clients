/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelScopedOperationParams } from "@itwin/imodels-client-management";

export interface BriefcaseProperties {
  deviceName: string;
}

export interface AcquireBriefcaseParams extends iModelScopedOperationParams {
  briefcaseProperties?: BriefcaseProperties;
}

export interface ReleaseBriefcaseParams extends iModelScopedOperationParams {
  briefcaseId: number;
}
