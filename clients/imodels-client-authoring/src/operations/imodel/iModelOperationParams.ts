/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateEmptyiModelParams, iModelProperties } from "@itwin/imodels-client-management";

export interface iModelPropertiesForCreateFromBaseline extends iModelProperties {
  filePath: string;
}

export interface CreateiModelFromBaselineParams extends CreateEmptyiModelParams {
  imodelProperties: iModelPropertiesForCreateFromBaseline;
  timeOutInMs?: number;
}
