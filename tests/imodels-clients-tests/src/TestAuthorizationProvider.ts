import { RequestContext } from "@itwin/imodels-client-management";
import { Config } from "./Config";
import { TestAuthClient } from "./TestAuthClient";

export class TestAuthorizationProvider {
  private static _requestContext: RequestContext;
  private static _authClient: TestAuthClient = new TestAuthClient({
    authority: Config.get().auth.authority,
    clientId: Config.get().auth.clientId,
    clientSecret: Config.get().auth.clientSecret,
    scopes: Config.get().apis.imodels.scopes,
    redirectUrl: Config.get().auth.redirectUrl
  });

  public static async getRequestContext(): Promise<RequestContext> {
    return TestAuthorizationProvider._requestContext ?? await TestAuthorizationProvider.initializeAndGetRequestContext();
  }

  private static async initializeAndGetRequestContext(): Promise<RequestContext> {
    TestAuthorizationProvider._requestContext = {
      authorization: {
        scheme: "Bearer",
        token: await TestAuthorizationProvider._authClient.getAccessToken({
          email: Config.get().testUser.email,
          password: Config.get().testUser.password
        })
      }
    };
    return TestAuthorizationProvider._requestContext;
  }
}