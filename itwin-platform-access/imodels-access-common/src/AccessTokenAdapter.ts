/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AccessToken, RepositoryStatus } from "@itwin/core-bentley";
import { IModelError } from "@itwin/core-common";

import { Authorization, AuthorizationCallback } from "@itwin/imodels-client-management";

export class AccessTokenAdapter {
  public static toAuthorization(accessToken: AccessToken): Authorization {
    const splitAccessToken = accessToken.split(" ");
    if (splitAccessToken.length !== 2)
      throw new IModelError(RepositoryStatus.InvalidRequest, "Unsupported access token format");

    return {
      scheme: splitAccessToken[0],
      token: splitAccessToken[1]
    };
  }

  /** @deprecated in 5.2. Use {@link toAuthorizationCallback} with a callback parameter instead. */
  public static toAuthorizationCallback(accessToken: AccessToken): AuthorizationCallback;

  // eslint-disable-next-line @typescript-eslint/unified-signatures
  public static toAuthorizationCallback(getAccessToken: () => Promise<AccessToken>): AuthorizationCallback;

  public static toAuthorizationCallback(accessToken: AccessToken | (() => Promise<AccessToken>)): AuthorizationCallback {
    if (typeof accessToken === "function") {
      return async () => {
        const token = await accessToken();

        return AccessTokenAdapter.toAuthorization(token);
      };
    } else {
      return async () => AccessTokenAdapter.toAuthorization(accessToken);
    }
  }
}
