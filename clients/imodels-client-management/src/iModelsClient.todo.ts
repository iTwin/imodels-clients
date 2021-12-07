/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, RecursiveRequired, RestClient } from "./base";
import { Constants } from "./Constants";
import { BriefcaseOperations, ChangesetOperations, NamedVersionOperations, IModelOperations } from "./operations";
import { CheckpointOperations } from "./operations/checkpoint/CheckpointOperations";
import { IModelsApiUrlFormatter } from "./operations/IModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

export interface ApiOptions {
  baseUri?: string;
  version?: string;
}

export interface IModelsClientOptions {
  restClient?: RestClient;
  api?: ApiOptions;
}

export class IModelsClient {
  private _operationsOptions: OperationOptions;

  constructor(options?: IModelsClientOptions) {
    const filledIModelsClientOptions = IModelsClient.fillConfiguration(options);
    this._operationsOptions = {
      ...filledIModelsClientOptions,
      urlFormatter: new IModelsApiUrlFormatter(filledIModelsClientOptions.api.baseUri)
    };
  }

  public get IModels(): IModelOperations<OperationOptions> {
    return new IModelOperations(this._operationsOptions);
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

  public static fillConfiguration(options?: IModelsClientOptions): RecursiveRequired<IModelsClientOptions> {
    return {
      restClient: options?.restClient ?? new AxiosRestClient(),
      api: {
        baseUri: options?.api?.baseUri ?? Constants.api.baseUrl,
        version: options?.api?.version ?? Constants.api.version
      }
    };
  }
}
