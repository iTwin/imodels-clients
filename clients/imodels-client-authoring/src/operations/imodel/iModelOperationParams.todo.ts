/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateEmptyIModelParams, IModelProperties } from "@itwin/imodels-client-management";

export interface IModelPropertiesForCreateFromBaseline extends IModelProperties {
  filePath: string;
}

export interface CreateIModelFromBaselineParams extends CreateEmptyIModelParams {
  iModelProperties: IModelPropertiesForCreateFromBaseline;
  timeOutInMs?: number;
}
