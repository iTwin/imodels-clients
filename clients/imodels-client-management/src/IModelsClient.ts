/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, IModelsErrorParser } from "./base/internal";
import { ApiOptions, HeaderFactories, RecursiveRequired, RestClient } from "./base/types";
import { Constants } from "./Constants";
import { BriefcaseOperations, ChangesetOperations, IModelOperations, NamedVersionOperations, ThumbnailOperations, UserOperations, UserPermissionOperations } from "./operations";
import { ChangesetGroupOperations } from "./operations/changeset-group/ChangesetGroupOperations";
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
  /** Additional headers to add to each request. See {@link HeaderFactories}. */
  headers?: HeaderFactories;
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
    const filledIModelsClientOptions = IModelsClient.fillManagementClientConfiguration(options);
    this._operationsOptions = {
      ...filledIModelsClientOptions,
      urlFormatter: new IModelsApiUrlFormatter(filledIModelsClientOptions.api.baseUrl)
    };
  }

  /** iModel operations. See {@link iModelOperations}. */
  public get iModels(): IModelOperations<OperationOptions> {
    return new IModelOperations(this._operationsOptions, this);
  }

  /** Briefcase operations. See {@link BriefcaseOperations}. */
  public get briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions, this);
  }

  /** Changeset operations. See {@link ChangesetOperations}. */
  public get changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this);
  }

  /** Changeset Group operations. See {@link ChangesetGroupOperations}. */
  public get changesetGroups(): ChangesetGroupOperations<OperationOptions> {
    return new ChangesetGroupOperations(this._operationsOptions, this);
  }

  /** Named version operations. See {@link NamedVersionOperations}. */
  public get namedVersions(): NamedVersionOperations<OperationOptions> {
    return new NamedVersionOperations(this._operationsOptions, this);
  }

  /** Checkpoint operations. See {@link CheckpointOperations}. */
  public get checkpoints(): CheckpointOperations<OperationOptions> {
    return new CheckpointOperations(this._operationsOptions);
  }

  /** Thumbnail operations. See {@link ThumbnailOperations}. */
  public get thumbnails(): ThumbnailOperations<OperationOptions> {
    return new ThumbnailOperations(this._operationsOptions);
  }

  /** User operations. See {@link UserOperations}. */
  public get users(): UserOperations<OperationOptions> {
    return new UserOperations(this._operationsOptions);
  }

  /** User Permission operations. See {@link UserPermissionOperations}. */
  public get userPermissions(): UserPermissionOperations<OperationOptions> {
    return new UserPermissionOperations(this._operationsOptions);
  }

  private static fillManagementClientConfiguration(
    options: IModelsClientOptions | undefined
  ): RecursiveRequired<IModelsClientOptions> {
    return {
      api: this.fillApiConfiguration(options?.api),
      restClient: options?.restClient ?? new AxiosRestClient(IModelsErrorParser.parse),
      headers: options?.headers ?? {}
    };
  }

  protected static fillApiConfiguration(
    apiOptions: ApiOptions | undefined
  ): RecursiveRequired<ApiOptions> {
    return {
      baseUrl: apiOptions?.baseUrl ?? Constants.api.baseUrl,
      version: apiOptions?.version ?? Constants.api.version
    };
  }
}
