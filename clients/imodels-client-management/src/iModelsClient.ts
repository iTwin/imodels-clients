/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { RecursiveRequired, iModelsErrorParser, RestClient, AxiosRestClient } from "./base";
import { Constants } from "./Constants";
import { iModelOperations, ChangesetOperations } from "./operations";

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
    this._options = iModelsClient.fillConfiguration(options);
  }

  public get iModels(): iModelOperations {
    return new iModelOperations(this._options);
  }

  public get Changesets(): ChangesetOperations {
    return new ChangesetOperations(this._options);
  }

  public static fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
    return {
      restClient: options?.restClient ?? new AxiosRestClient(iModelsErrorParser.parse),
      api: {
        baseUri: options?.api?.baseUri ?? Constants.Api.BaseUrl,
        version: options?.api?.version ?? Constants.Api.Version
      }
    };
  }
}
