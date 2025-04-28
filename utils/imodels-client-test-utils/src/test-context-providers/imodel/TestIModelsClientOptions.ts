/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { ApiOptions } from "@itwin/imodels-client-management";

import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig";

@injectable()
export class TestIModelsClientOptions implements IModelsClientOptions {
  public api: ApiOptions;

  constructor(
    config: IModelsClientsTestsConfig
  ) {
    this.api = { baseUrl: config.apis.iModels.baseUrl };
  }
}
