/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsApiUrlFormatter } from "@itwin/imodels-client-management";

describe("iModelsApiUrlFormatter", () => {
  let imodelsApiUrlFormatter: iModelsApiUrlFormatter;
  let imodelsApiBaseUri: string;

  before(() => {
    imodelsApiBaseUri = "https://api.bentley.com/imodels";
    imodelsApiUrlFormatter = new iModelsApiUrlFormatter(imodelsApiBaseUri);
  });

  // TODO: tests
});
