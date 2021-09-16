/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClientOptions, RequestContext } from "@itwin/imodels-client-authoring";
import { Config } from "./Config";
import { TestAuthenticationProvider } from "./TestAuthenticationProvider";
import { TestProjectProvider } from "./TestProjectProvider";

export class TestContext {
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

  public get ClientConfig(): iModelsClientOptions {
    return {
      api: {
        baseUri: Config.get().apis.imodels.baseUrl
      }
    };
  }

  public async getProjectId(): Promise<string> {
    return TestProjectProvider.getProjectId();
  }

  public async getRequestContext(): Promise<RequestContext> {
    return TestAuthenticationProvider.getRequestContext();
  }

  public getPrefixediModelName(imodelName: string): string {
    return `${this._imodelNamePrefix} ${imodelName}`;
  }

  public doesiModelBelongToContext(imodelName: string): boolean {
    return imodelName.startsWith(this._imodelNamePrefix);
  }
}
