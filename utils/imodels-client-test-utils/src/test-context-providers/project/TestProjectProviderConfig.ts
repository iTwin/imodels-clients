/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { inject, injectable } from "inversify";
import { BaseIntegrationTestsConfig } from "../../BaseIntegrationTestsConfig";
import { TestUtilTypes } from "../../TestUtilTypes";

@injectable()
export class TestProjectProviderConfig {
  public testProjectName: string;

  constructor(@inject(TestUtilTypes.BaseIntegrationTestsConfig) config: BaseIntegrationTestsConfig) {
    this.testProjectName = config.testProjectName;
  }
}
