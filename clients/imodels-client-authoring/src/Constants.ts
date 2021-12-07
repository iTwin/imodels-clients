/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants as ManagementIModelsClientConstants } from "@itwin/imodels-client-management";

export class Constants extends ManagementIModelsClientConstants {
  public static time = {
    sleepPeriodInMs: 1000,
    iModelInitiazationTimeOutInMs: 5 * 60 * 1000
  };
}
