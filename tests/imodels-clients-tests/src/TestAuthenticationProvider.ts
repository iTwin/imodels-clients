import { RequestContext } from "@itwin/imodels-client-management";
import { Config } from "./Config";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestAuthenticationProvider {
  private static _requestContext: RequestContext;
  private static _authClient: TestAuthenticationClient = new TestAuthenticationClient({
    authority: Config.get().auth.authority,
    clientId: Config.get().auth.clientId,
    clientSecret: Config.get().auth.clientSecret,
    redirectUrl: Config.get().auth.redirectUrl,
    scopes: Config.get().apis.imodels.scopes
  });

  public static async getRequestContext(): Promise<RequestContext> {
    return TestAuthenticationProvider._requestContext ?? await TestAuthenticationProvider.initializeAndGetRequestContext();
  }

  private static async initializeAndGetRequestContext(): Promise<RequestContext> {
    TestAuthenticationProvider._requestContext = {
      authorization: {
        scheme: "Bearer",
        token: await TestAuthenticationProvider._authClient.getAccessToken({
          email: Config.get().testUser.email,
          password: Config.get().testUser.password
        })
      }
    };
    return TestAuthenticationProvider._requestContext;
  }
}
