/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  Authorization,
  AuthorizationCallback,
} from "@itwin/imodels-client-management";

import { TestAuthorizationClient } from "./TestAuthorizationClient";
import { TestAuthorizationProviderConfig } from "./TestAuthorizationProviderConfig";

@injectable()
export class TestAuthorizationProvider {
  private _authorizations: { [key: string]: Authorization } = {};

  constructor(
    private readonly _config: TestAuthorizationProviderConfig,
    private readonly _testiModelsAuthClient: TestAuthorizationClient
  ) {}

  public getAdmin1Authorization(): AuthorizationCallback {
    return this.getAuthorization({
      ...this._config.testUsers.admin1,
      scopes: this._config.apiScopes.iModels,
    });
  }

  public getFullyFeaturedAdmin2Authorization(): AuthorizationCallback {
    return this.getAuthorization({
      ...this._config.testUsers.admin2FullyFeatured,
      scopes: this._config.apiScopes.iModels,
    });
  }

  public getAdmin1AuthorizationForITwins(): AuthorizationCallback {
    return this.getAuthorization({
      ...this._config.testUsers.admin1,
      scopes: this._config.apiScopes.iTwins,
    });
  }

  private getAuthorization(testUser: {
    email: string;
    password: string;
    scopes: string;
  }): AuthorizationCallback {
    return async () => {
      const userKey = this.getKey(testUser);
      if (!this._authorizations[userKey]) {
        const accessToken = await this._testiModelsAuthClient.getAccessToken(
          testUser
        );
        this._authorizations[userKey] = {
          scheme: "Bearer",
          token: accessToken,
        };
      }

      return this._authorizations[userKey];
    };
  }

  private getKey(testUser: {
    email: string;
    password: string;
    scopes: string;
  }): string {
    return `${testUser.email}+${testUser.scopes}`;
  }
}
