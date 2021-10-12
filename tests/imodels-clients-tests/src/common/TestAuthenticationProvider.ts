/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { RequestContext } from "@itwin/imodels-client-management";
import { Config, TestUserConfigValues } from "./Config";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestAuthenticationProvider {
  private static _requestContexts: { [key: string]: RequestContext; } = {};
  private static _imodelsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.imodels.scopes
  });

  public static async getRequestContext(testUser: TestUserConfigValues): Promise<RequestContext> {
    return TestAuthenticationProvider._requestContexts[testUser.email] ?? await TestAuthenticationProvider.initializeAndGetRequestContext(testUser);
  }

  private static async initializeAndGetRequestContext(testUser: TestUserConfigValues): Promise<RequestContext> {
    TestAuthenticationProvider._requestContexts[testUser.email] = {
      authorization: {
        scheme: "Bearer",
        token: await TestAuthenticationProvider._imodelsApiAuthClient.getAccessToken(testUser)
      }
    };
    return TestAuthenticationProvider._requestContexts[testUser.email];
  }
}
