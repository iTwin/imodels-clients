/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateEmptyiModelParams, iModelProperties } from "@itwin/imodels-client-management";

/** Properties that should be specified when creating a new iModel from baseline file. */
export interface iModelPropertiesForCreateFromBaseline extends iModelProperties {
  /** Absolute path of the iModel baseline file. The file must exist. */
  filePath: string;
}

/** Parameters for create iModel from baseline file operation. */
export interface CreateiModelFromBaselineParams extends CreateEmptyiModelParams {
  /** Properties for the new iModel. */
  imodelProperties: iModelPropertiesForCreateFromBaseline;
  /** Time period to wait until the iModel is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}
