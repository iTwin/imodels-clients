/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  TestAuthorizationProvider,
  TestIModelsClient,
  TestITwinProvider,
} from "../test-context-providers";

import { TestIModelGroup } from "./TestIModelGroup";

@injectable()
export class TestIModelGroupFactory {
  constructor(
    private readonly _iModelsClient: TestIModelsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testITwinProvider: TestITwinProvider
  ) {}

  public create(testRunContext: {
    testRunId: string;
    packageName: string;
    testSuiteName?: string;
  }): TestIModelGroup {
    return new TestIModelGroup(
      this._iModelsClient,
      this._testAuthorizationProvider,
      this._testITwinProvider,
      testRunContext
    );
  }
}
