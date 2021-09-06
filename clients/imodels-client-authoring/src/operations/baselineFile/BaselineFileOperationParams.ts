/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { RequestContextParam } from "@itwin/imodels-client-management";

export interface GetBaselineFileByiModelIdParams extends RequestContextParam {
  imodelId: string;
}
