/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, RecursiveRequired, RestClient } from "./base";
import { Constants } from "./Constants";
import { BriefcaseOperations, ChangesetOperations, NamedVersionOperations, iModelOperations, CheckpointOperations } from "./operations";

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

  public get Briefcases(): BriefcaseOperations {
    return new BriefcaseOperations(this._options);
  }

  public get Changesets(): ChangesetOperations {
    return new ChangesetOperations(this._options, this.Checkpoints);
  }

  public get NamedVersions(): NamedVersionOperations {
    return new NamedVersionOperations(this._options);
  }

  public get Checkpoints(): CheckpointOperations {
    return new CheckpointOperations(this._options);
  }

  public static fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
    return {
      restClient: options?.restClient ?? new AxiosRestClient(),
      api: {
        baseUri: options?.api?.baseUri ?? Constants.api.baseUrl,
        version: options?.api?.version ?? Constants.api.version
      }
    };
  }
}
