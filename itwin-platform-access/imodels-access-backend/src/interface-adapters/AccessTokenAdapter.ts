/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AccessToken, RepositoryStatus } from "@itwin/core-bentley";
import { IModelError } from "@itwin/core-common";
import { Authorization, AuthorizationCallback } from "@itwin/imodels-client-authoring";

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

  public static toAuthorizationCallback(accessToken: AccessToken): AuthorizationCallback {
    const authorization: Authorization = AccessTokenAdapter.toAuthorization(accessToken);
    return async () => authorization;
  }
}
