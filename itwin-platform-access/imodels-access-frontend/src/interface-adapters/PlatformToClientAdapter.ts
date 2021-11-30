/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AccessToken, BentleyError, BentleyStatus } from "@itwin/core-bentley";
import { Authorization, AuthorizationCallback } from "@itwin/imodels-client-management";

export class PlatformToClientAdapter {
  public static toAuthorization(accessToken: AccessToken): Authorization {
    const splitAccessToken = accessToken.split(" ");
    if (splitAccessToken.length !== 2)
      throw new BentleyError(BentleyStatus.ERROR, "Unsupported access token format");

    return {
      scheme: splitAccessToken[0],
      token: splitAccessToken[1]
    };
  }

  public static toAuthorizationCallback(accessToken: AccessToken): AuthorizationCallback {
    const authorization: Authorization = PlatformToClientAdapter.toAuthorization(accessToken);
    return async () => Promise.resolve(authorization);
  }
}
