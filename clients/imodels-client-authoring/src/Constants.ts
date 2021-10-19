/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants as ManagementiModelsClientConstants } from "@itwin/imodels-client-management";

export class Constants extends ManagementiModelsClientConstants {
  public static time = {
    sleepPeriodInMs: 1000,
    imodelInitiazationTimeOutInMs: 5 * 60 * 1000
  }
}
