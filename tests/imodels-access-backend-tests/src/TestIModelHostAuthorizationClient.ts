/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AuthorizationClient } from "@itwin/core-common";

export class TestIModelHostAuthorizationClient implements AuthorizationClient {
  constructor(private _accessToken: string) {}

  public getAccessToken(): Promise<string> {
    return Promise.resolve(this._accessToken);
  }
}
