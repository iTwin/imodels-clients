/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateEmptyIModelParams,
  IModelProperties,
} from "@itwin/imodels-client-management";

/** Properties that should be specified when creating a new iModel from baseline file. */
export interface IModelPropertiesForCreateFromBaseline
  extends IModelProperties {
  /** Absolute path of the iModel baseline file. The file must exist. */
  filePath: string;
}

/** Parameters for create iModel from baseline file operation. */
export interface CreateIModelFromBaselineParams
  extends CreateEmptyIModelParams {
  /** Properties of the new iModel. See {@link iModelPropertiesForCreateFromBaseline}. */
  iModelProperties: IModelPropertiesForCreateFromBaseline;
  /** Time period to wait until the iModel is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}
