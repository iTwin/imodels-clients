/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClientOptions, RequestContext } from "@itwin/imodels-client-authoring";
import { Config } from "./Config";

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
        baseUri: Config.get().ApiBaseUrl
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

  public doesiModelBelongToContext(imodelName: string): boolean {
    return imodelName.startsWith(this._imodelNamePrefix);
  }
}
