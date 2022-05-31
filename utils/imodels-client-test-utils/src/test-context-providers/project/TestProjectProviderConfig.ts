/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";
import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig";

@injectable()
export class TestProjectProviderConfig {
  public testProjectName: string;

  constructor(config: IModelsClientsTestsConfig) {
    this.testProjectName = config.testProjectName;
  }
}
