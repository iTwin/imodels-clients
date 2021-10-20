/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback } from "@itwin/imodels-client-management";
import { Config, TestUserConfigValues } from "../../Config";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestAuthenticationProvider {
  private static _authorizations: { [key: string]: AuthorizationCallback; } = {};
  private static _imodelsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.imodels.scopes
  });

  public static async getRequestContext(testUser: TestUserConfigValues): Promise<AuthorizationCallback> {
    return TestAuthenticationProvider._authorizations[testUser.email] ?? await TestAuthenticationProvider.initializeAndGetRequestContext(testUser);
  }

  private static async initializeAndGetRequestContext(testUser: TestUserConfigValues): Promise<AuthorizationCallback> {
    const accessToken = await TestAuthenticationProvider._imodelsApiAuthClient.getAccessToken(testUser);
    TestAuthenticationProvider._authorizations[testUser.email] = () => Promise.resolve({ scheme: "Bearer", token: accessToken });

    return TestAuthenticationProvider._authorizations[testUser.email];
  }
}
