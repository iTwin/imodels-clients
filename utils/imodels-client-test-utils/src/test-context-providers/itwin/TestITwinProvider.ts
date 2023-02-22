/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";

import { ITwinsClient } from "./ITwinsClient";
import { TestITwinProviderConfig } from "./TestITwinProviderConfig";

@injectable()
export class TestITwinProvider {
  private _iTwinId: string | undefined;

  constructor(
    private readonly _testITwinProviderConfig: TestITwinProviderConfig,
    private readonly _iTwinsClient: ITwinsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider
  ) { }

  public async getOrCreate(): Promise<string> {
    return this._iTwinId ?? await this.initialize();
  }

  private async initialize(): Promise<string> {
    const authorization = this._testAuthorizationProvider.getAdmin1AuthorizationForITwins();
    this._iTwinId = await this._iTwinsClient.getOrCreateITwin({
      authorization,
      iTwinName: this._testITwinProviderConfig.testITwinName
    });
    return this._iTwinId;
  }
}
