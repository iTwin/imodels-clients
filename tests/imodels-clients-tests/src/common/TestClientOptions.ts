/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ApiOptions, iModelsClientOptions } from "@itwin/imodels-client-management";
import { Config } from "./Config";

export class TestClientOptions implements iModelsClientOptions {
  public api: ApiOptions;

  constructor() {
    const imodelsApiConfig = Config.get().apis.imodels;
    this.api = {
      baseUri: imodelsApiConfig.baseUrl,
      version: imodelsApiConfig.version
    };
  }
}
