/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig.js";

@injectable()
export class TestITwinProviderConfig {
  public testITwinName: string;

  constructor(config: IModelsClientsTestsConfig) {
    this.testITwinName = config.testITwinName;
  }
}
