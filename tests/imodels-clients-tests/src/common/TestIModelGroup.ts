/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { getTestRunId } from "./CommonTestUtils";

export class TestIModelGroup {
  private _iModelNamePrefix: string;

  constructor(params: {
    labels: {
      package: string;
      testSuite?: string;
    };
  }) {
    this._iModelNamePrefix = `[${getTestRunId()}][${params.labels.package}]`;
    if (params.labels.testSuite)
      this._iModelNamePrefix += `[${params.labels.testSuite}]`;
  }

  public getPrefixedUniqueIModelName(iModelName: string): string {
    return `${this._iModelNamePrefix} ${iModelName}`;
  }

  public doesIModelBelongToContext(iModelName: string): boolean {
    return iModelName.startsWith(this._iModelNamePrefix);
  }
}
