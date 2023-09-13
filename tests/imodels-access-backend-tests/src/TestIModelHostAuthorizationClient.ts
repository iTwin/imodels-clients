/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AuthorizationClient } from "@itwin/core-common";

export class TestIModelHostAuthorizationClient implements AuthorizationClient {
  constructor(private _accessToken: string) {
  }

  public async getAccessToken(): Promise<string> {
    return this._accessToken;
  }
}
