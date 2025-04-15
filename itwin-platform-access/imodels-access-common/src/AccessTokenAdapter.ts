/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AccessToken, ITwinError } from "@itwin/core-bentley";

import { Authorization, AuthorizationCallback, IModelsErrorCode, IModelsErrorScope } from "@itwin/imodels-client-management";

export class AccessTokenAdapter {
  public static toAuthorization(accessToken: AccessToken): Authorization {
    const splitAccessToken = accessToken.split(" ");
    if (splitAccessToken.length !== 2)
      ITwinError.throwError({
        iTwinErrorId: {
          key: IModelsErrorCode.InvalidIModelsRequest,
          scope: IModelsErrorScope
        },
        message: "Unsupported access token format"
      });

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
