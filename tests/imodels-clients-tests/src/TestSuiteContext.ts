/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClientOptions, RequestContext } from "@itwin/imodels-client-authoring";

export class TestSuiteContext {
  private _imodelNamePrefix: string;

  constructor(prefixes: {
    package: string,
    testSuite?: string,
  }) {
    this._imodelNamePrefix = prefixes.package;
    if (prefixes.testSuite)
      this._imodelNamePrefix += prefixes.testSuite;
  }

  public get ClientConfig(): iModelsClientOptions {
    return {
      api: {
        baseUri: "" // TODO: read config
      }
    };
  }

  public get ProjectId(): string {
    return ""; // TODO: read config
  }

  public get RequestContext(): RequestContext {
    return {
      authorization: {
        scheme: "", // TODO: read config
        token: "" // TODO: read config
      }
    };
  }

  public getPrefixediModelName(imodelName: string): string {
    return `${this._imodelNamePrefix} ${imodelName}`;
  }

  public doesiModelBelongToSuite(imodelName: string): boolean {
    return imodelName.startsWith(this._imodelNamePrefix);
  }
}
