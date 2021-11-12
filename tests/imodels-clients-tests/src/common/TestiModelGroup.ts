/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export class TestiModelGroup {
  private _imodelNamePrefix: string;

  constructor(params: {
    labels: {
      package: string,
      testSuite?: string,
    }
  }) {
    this._imodelNamePrefix = `[${params.labels.package}]`;
    if (params.labels.testSuite)
      this._imodelNamePrefix += `[${params.labels.testSuite}]`;
  }

  public getPrefixedUniqueiModelName(imodelName: string): string {
    return `${this._imodelNamePrefix} ${imodelName} ${new Date().toISOString()}`;
  }

  public doesiModelBelongToContext(imodelName: string): boolean {
    return imodelName.startsWith(this._imodelNamePrefix);
  }
}
