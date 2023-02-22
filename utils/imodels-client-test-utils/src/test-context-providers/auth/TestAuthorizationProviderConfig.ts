/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IModelsClientsTestsConfig, TestUsersConfigValues } from "../../IModelsClientsTestsConfig";

interface ApiScopes {
  iModels: string;
  iTwins: string;
}

@injectable()
export class TestAuthorizationProviderConfig {
  public testUsers: TestUsersConfigValues;
  public apiScopes: ApiScopes;

  constructor(
    config: IModelsClientsTestsConfig
  ) {
    this.testUsers = config.testUsers;
    this.apiScopes = {
      iModels: config.apis.iModels.scopes,
      iTwins: config.apis.iTwins.scopes
    };
  }
}
