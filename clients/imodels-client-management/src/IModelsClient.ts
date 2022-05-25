/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ApiOptions, AxiosRestClient, RecursiveRequired, RestClient } from "./base";
import { Constants } from "./Constants";
import { BriefcaseOperations, ChangesetOperations, IModelOperations, NamedVersionOperations, UserOperations, UserPermissionOperations } from "./operations";
import { CheckpointOperations } from "./operations/checkpoint/CheckpointOperations";
import { IModelsApiUrlFormatter } from "./operations/IModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

/** User-configurable iModels client options. */
export interface IModelsClientOptions {
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
export class IModelsClient {
  protected _operationsOptions: OperationOptions;

  /**
   * Class constructor.
   * @param {iModelsClientOptions} options client options. If `options` are `undefined` or if some of the properties
   * are `undefined` the client uses defaults. See {@link iModelsClientOptions}.
   */
  constructor(options?: IModelsClientOptions) {
    const filledIModelsClientOptions = IModelsClient.fillConfiguration(options);
    this._operationsOptions = {
      ...filledIModelsClientOptions,
      urlFormatter: new IModelsApiUrlFormatter(filledIModelsClientOptions.api.baseUrl)
    };
  }

  /** iModel operations. See {@link iModelOperations}. */
  public get iModels(): IModelOperations<OperationOptions> {
    return new IModelOperations(this._operationsOptions);
  }

  /** Briefcase operations. See {@link BriefcaseOperations}. */
  public get briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions);
  }

  /** Changeset operations. See {@link ChangesetOperations}. */
  public get changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this.namedVersions, this.checkpoints);
  }

  /** Named version operations. See {@link NamedVersionOperations}. */
  public get namedVersions(): NamedVersionOperations<OperationOptions> {
    return new NamedVersionOperations(this._operationsOptions);
  }

  /** Checkpoint operations. See {@link CheckpointOperations}. */
  public get checkpoints(): CheckpointOperations<OperationOptions> {
    return new CheckpointOperations(this._operationsOptions);
  }

  /** User operations. See {@link UserOperations}. */
  public get users(): UserOperations<OperationOptions> {
    return new UserOperations(this._operationsOptions);
  }

  /** User Permission operations. See {@link UserPermissionOperations}. */
  public get userPermissions(): UserPermissionOperations<OperationOptions> {
    return new UserPermissionOperations(this._operationsOptions);
  }

  /**
   * Creates a required configuration instance from user provided options and applying default ones for not specified
   * options. See {@link iModelsClientOptions}.
   * @param {iModelsClientOptions} options user-passed client options.
   * @returns {RecursiveRequired<iModelsClientOptions>} required iModels client configuration options.
   */
  public static fillConfiguration(options?: IModelsClientOptions): RecursiveRequired<IModelsClientOptions> {
    return {
      restClient: options?.restClient ?? new AxiosRestClient(),
      api: {
        baseUrl: options?.api?.baseUrl ?? Constants.api.baseUrl,
        version: options?.api?.version ?? Constants.api.version
      }
    };
  }
}
