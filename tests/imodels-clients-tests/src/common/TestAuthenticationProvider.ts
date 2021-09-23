/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { RequestContext } from "@itwin/imodels-client-management";
import { Config } from "./Config";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestAuthenticationProvider {
  private static _requestContext: RequestContext;
  private static _imodelsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.imodels.scopes
  });

  public static async getRequestContext(): Promise<RequestContext> {
    return TestAuthenticationProvider._requestContext ?? await TestAuthenticationProvider.initializeAndGetRequestContext();
  }

  private static async initializeAndGetRequestContext(): Promise<RequestContext> {
    TestAuthenticationProvider._requestContext = {
      authorization: {
        scheme: "Bearer",
        token: await TestAuthenticationProvider._imodelsApiAuthClient.getAccessToken(Config.get().testUser)
      }
    };
    return TestAuthenticationProvider._requestContext;
  }
}
