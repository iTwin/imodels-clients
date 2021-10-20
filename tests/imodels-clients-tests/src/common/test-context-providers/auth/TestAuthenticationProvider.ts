/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Authorization } from "@itwin/imodels-client-management";
import { Config, TestUserConfigValues } from "../../Config";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestAuthenticationProvider {
  private static _authorizations: { [key: string]: Authorization; } = {};
  private static _imodelsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.imodels.scopes
  });

  public static async getRequestContext(testUser: TestUserConfigValues): Promise<Authorization> {
    return TestAuthenticationProvider._authorizations[testUser.email] ?? await TestAuthenticationProvider.initializeAndGetRequestContext(testUser);
  }

  private static async initializeAndGetRequestContext(testUser: TestUserConfigValues): Promise<Authorization> {
    TestAuthenticationProvider._authorizations[testUser.email] = {
      scheme: "Bearer",
      token: await TestAuthenticationProvider._imodelsApiAuthClient.getAccessToken(testUser)
    };
    return TestAuthenticationProvider._authorizations[testUser.email];
  }
}
