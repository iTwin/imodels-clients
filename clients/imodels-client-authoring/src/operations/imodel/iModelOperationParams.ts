/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateEmptyiModelParams } from "@itwin/imodels-client-management";
export interface BaselineFileProperties {
  path: string;
}

export interface CreateiModelFromBaselineParams extends CreateEmptyiModelParams {
  baselineFileProperties: BaselineFileProperties;
}
