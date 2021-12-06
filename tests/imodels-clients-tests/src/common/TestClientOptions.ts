/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ApiOptions, IModelsClientOptions } from "@itwin/imodels-client-management";
import { Config } from "./Config";

export class TestClientOptions implements IModelsClientOptions {
  public api: ApiOptions;

  constructor() {
    this.api = Config.get().apis.iModels;
  }
}
