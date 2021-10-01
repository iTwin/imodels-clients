/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ApiOptions, iModelsClientOptions } from "@itwin/imodels-client-management";
import { Config } from "./Config";

export class TestClientOptions implements iModelsClientOptions {
  public api: ApiOptions;

  constructor() {
    this.api = {
      baseUri: Config.get().apis.imodels.baseUrl
    };
  }
}
