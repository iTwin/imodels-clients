/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback } from "@itwin/imodels-client-management";
import { Config, TestUserConfigValues } from "../../Config";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestAuthorizationProvider {
  private static _authorizations: { [key: string]: AuthorizationCallback } = {};
  private static _iModelsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.iModels.scopes
  });

  public static async getAuthorization(testUser: TestUserConfigValues): Promise<AuthorizationCallback> {
    return TestAuthorizationProvider._authorizations[testUser.email] ?? await TestAuthorizationProvider.initializeAndGetAuthorization(testUser);
  }

  private static async initializeAndGetAuthorization(testUser: TestUserConfigValues): Promise<AuthorizationCallback> {
    const accessToken = await TestAuthorizationProvider._iModelsApiAuthClient.getAccessToken(testUser);
    TestAuthorizationProvider._authorizations[testUser.email] = async () => ({ scheme: "Bearer", token: accessToken });

    return TestAuthorizationProvider._authorizations[testUser.email];
  }
}