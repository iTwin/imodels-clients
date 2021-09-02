/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { RecursiveRequired, iModelsErrorParser, RestClient, AxiosRestClient } from "./base";
import { iModelOperations } from "./operations/imodel/iModelOperations";

export interface ApiOptions {
  baseUri?: string;
  version?: string;
}

export interface iModelsClientOptions {
  restClient?: RestClient;
  api?: ApiOptions;
}

export class iModelsClient {
  private _options: RecursiveRequired<iModelsClientOptions>;

  constructor(options?: iModelsClientOptions) {
    this._options = fillConfiguration(options);
  }

  public get iModels(): iModelOperations {
    return new iModelOperations(this._options);
  }
}

export function fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
  return {
    restClient: options?.restClient ?? new AxiosRestClient(iModelsErrorParser.parse),
    api: {
      baseUri: options?.api?.baseUri ?? "https://api.bentley.com/imodels",
      version: options?.api?.version ?? "v1"
    }
  };
}
