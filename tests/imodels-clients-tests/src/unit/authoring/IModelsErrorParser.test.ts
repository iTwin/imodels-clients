/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsErrorParser as AuthoringIModelsErrorParser } from "@itwin/imodels-client-authoring";

import { testIModelsErrorParser } from "../CommonErrorParsingTests";

describe("[Authoring] IModelsErrorParser", () => {
  testIModelsErrorParser(AuthoringIModelsErrorParser.parse);
});
