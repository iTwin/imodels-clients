/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig.js";

@injectable()
export class ITwinsClientConfig {
  public baseUrl: string;

  constructor(
    config: IModelsClientsTestsConfig
  ) {
    this.baseUrl = config.apis.iTwins.baseUrl;
  }
}
