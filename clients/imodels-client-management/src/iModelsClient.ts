/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, RecursiveRequired, RestClient } from "./base";
import { Constants } from "./Constants";
import { BriefcaseOperations, ChangesetOperations, NamedVersionOperations, iModelOperations } from "./operations";
import { CheckpointOperations } from "./operations/checkpoint/CheckpointOperations";
import { iModelsApiUrlFormatter } from "./operations/iModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

export interface ApiOptions {
  baseUri?: string;
  version?: string;
}

export interface iModelsClientOptions {
  restClient?: RestClient;
  api?: ApiOptions;
}

export class iModelsClient {
  private _operationsOptions: OperationOptions;

  constructor(options?: iModelsClientOptions) {
    const filledUserOptions = iModelsClient.fillConfiguration(options);
    this._operationsOptions = {
      ...filledUserOptions,
      urlFormatter: new iModelsApiUrlFormatter(filledUserOptions.api.baseUri)
    };
  }

  public get iModels(): iModelOperations<OperationOptions> {
    return new iModelOperations(this._operationsOptions);
  }

  public get Briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions);
  }

  public get Changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this.NamedVersions, this.Checkpoints);
  }

  public get NamedVersions(): NamedVersionOperations<OperationOptions> {
    return new NamedVersionOperations(this._operationsOptions);
  }

  public get Checkpoints(): CheckpointOperations<OperationOptions> {
    return new CheckpointOperations(this._operationsOptions);
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
