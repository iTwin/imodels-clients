/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelScopedOperationParams } from "@itwin/imodels-client-management";

/** Properties that should be specified when acquiring a new Briefcase. */
export interface BriefcaseProperties {
  /** Name of the device which will hold the briefcase. */
  deviceName: string;
}

/** Parameters for acquire Briefcase operation. */
export interface AcquireBriefcaseParams extends IModelScopedOperationParams {
  /** Properties of the new Briefcase. */
  briefcaseProperties?: BriefcaseProperties;
}

/** Parameters for release Briefcase operation. */
export interface ReleaseBriefcaseParams extends IModelScopedOperationParams {
  /** Id of the Briefcase to release. */
  briefcaseId: number;
}
