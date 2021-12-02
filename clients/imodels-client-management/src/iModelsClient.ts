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

/** iModels API endpoint options. */
export interface ApiOptions {
  /** iModels API base url. Default value is `https://api.bentley.com/imodels`. */
  baseUri?: string;
  /** iModels API version. Default value is `itwin-platform.v1`. */
  version?: string;
}

/** User-configurable iModels client options. */
export interface iModelsClientOptions {
  /** 
   * Rest client that is used for making HTTP requests. If `undefined` the default client is used which is implemented
   * using `axios` library. See {@link AxiosRestClient}.
   */
  restClient?: RestClient;
  /** iModels API options. See {@link ApiOptions}. */
  api?: ApiOptions;
}

/**
 * iModels API client for iModel management workflows. For more information on the API visit the
 * {@link https://developer.bentley.com/apis/imodels/ iModels API documentation page}.
 */
export class iModelsClient {
  private _operationsOptions: OperationOptions;

  /** 
   * Class constructor. 
   * @param {iModelsClientOptions} options client options. If `options` are `undefined` or if some of the properties
   * are `undefined` the client uses defaults. See {@link iModelsClientOptions}.
   */
  constructor(options?: iModelsClientOptions) {
    const fillediModelsClientOptions = iModelsClient.fillConfiguration(options);
    this._operationsOptions = {
      ...fillediModelsClientOptions,
      urlFormatter: new iModelsApiUrlFormatter(fillediModelsClientOptions.api.baseUri)
    };
  }

  /** iModel operations. See {@link iModelOperations}. */
  public get iModels(): iModelOperations<OperationOptions> {
    return new iModelOperations(this._operationsOptions);
  }

  /** Briefcase operations. See {@link BriefcaseOperations}. */
  public get Briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions);
  }

  /** Changeset operations. See {@link ChangesetOperations}. */
  public get Changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this.NamedVersions, this.Checkpoints);
  }

  /** Named version operations. See {@link NamedVersionOperations}. */
  public get NamedVersions(): NamedVersionOperations<OperationOptions> {
    return new NamedVersionOperations(this._operationsOptions);
  }

  /** Checkpoint operations. See {@link CheckpointOperations}. */
  public get Checkpoints(): CheckpointOperations<OperationOptions> {
    return new CheckpointOperations(this._operationsOptions);
  }

  /** 
   * Creates a configuration from user-specified properties and default values. See {@link iModelsClientOptions}.
   * @param {iModelsClientOptions} options user-passed client options.
   * @returns {RecursiveRequired<iModelsClientOptions>} options with all the gaps filled with default values.
   */
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
