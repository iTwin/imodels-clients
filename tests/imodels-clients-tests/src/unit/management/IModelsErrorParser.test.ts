/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsErrorParser as ManagementIModelsErrorParser } from "@itwin/imodels-client-management";

import { testIModelsErrorParser } from "../CommonErrorParsingTests";

describe("[Management] IModelsErrorParser", () => {
  testIModelsErrorParser(ManagementIModelsErrorParser.parse);
});
