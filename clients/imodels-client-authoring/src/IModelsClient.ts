/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AxiosRestClient,
  AxiosRetryPolicy,
  Constants,
  ExponentialBackoffAlgorithm,
  IModelsOriginalError,
  IModelsClient as ManagementIModelsClient,
  IModelsClientOptions as ManagementIModelsClientOptions,
  RecursiveRequired,
  ResponseInfo,
} from "@itwin/imodels-client-management";

import { ClientStorage } from "@itwin/object-storage-core";

import { IModelsErrorParser, NodeLocalFileSystem } from "./base/internal";
import { LocalFileSystem } from "./base/types";
import {
  BaselineFileOperations,
  BriefcaseOperations,
  ChangesetExtendedDataOperations,
  ChangesetGroupOperations,
  ChangesetOperations,
  IModelOperations,
  IModelsApiUrlFormatter,
  LockOperations,
  OperationOptions,
} from "./operations";

/** User-configurable iModels client options. */
export interface IModelsClientOptions extends ManagementIModelsClientOptions {
  /**
   * Local filesystem to use in operations which transfer files. Examples of such operations are Changeset download in
   * {@link ChangesetOperations}, iModel creation from Baseline in {@link iModelOperations}. If `undefined` the default
   * is used which is `LocalFsImpl` that is implemented using Node's `fs` module.
   */
  localFileSystem?: LocalFileSystem;
  /**
   * Storage handler to use in operations which transfer files. Examples of such operations are Changeset download in
   * {@link ChangesetOperations}, iModel creation from Baseline in {@link iModelOperations}. You can use
   * {@link createDefaultClientStorage} which supports both Azure and Google storage.
   */
  cloudStorage: ClientStorage;
}

/**
 * iModels API client for iModel authoring workflows. For more information on the API visit the
 * {@link https://developer.bentley.com/apis/imodels-v2/ iModels API documentation page}.
 */
export class IModelsClient extends ManagementIModelsClient {
  protected override _operationsOptions: OperationOptions;

  /**
   * Class constructor.
   * @param {iModelsClientOptions} options client options. If `options` are `undefined` or if some of the properties
   * are `undefined` the client uses defaults. See {@link iModelsClientOptions}.
   */
  constructor(options: IModelsClientOptions) {
    const filledIModelsClientOptions =
      IModelsClient.fillAuthoringClientConfiguration(options);
    super(filledIModelsClientOptions);

    this._operationsOptions = {
      ...filledIModelsClientOptions,
      parseErrorFunc: (
        response: ResponseInfo,
        originalError: IModelsOriginalError
      ) => IModelsErrorParser.parse(response, originalError),
      urlFormatter: new IModelsApiUrlFormatter(
        filledIModelsClientOptions.api.baseUrl
      ),
    };
  }

  /**
   * `ClientStorage` instance that is used for file transfer operations. This uses the user provided instance or default one,
   * see {@link IModelsClientOptions}.
   */
  public get cloudStorage(): ClientStorage {
    return this._operationsOptions.cloudStorage;
  }

  /** iModel operations. See {@link iModelOperations}. */
  public override get iModels(): IModelOperations<OperationOptions> {
    return new IModelOperations(this._operationsOptions, this);
  }

  /** Baseline file operations. See {@link BaselineFileOperations}. */
  public get baselineFiles(): BaselineFileOperations<OperationOptions> {
    return new BaselineFileOperations(this._operationsOptions);
  }

  /** Briefcase operations. See {@link BriefcaseOperations}. */
  public override get briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions, this);
  }

  /** Changeset operations. See {@link ChangesetOperations}. */
  public override get changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this);
  }

  /** Changeset Extended Data operations. See {@link ChangesetExtendedDataOperations}. */
  public override get changesetExtendedData(): ChangesetExtendedDataOperations<OperationOptions> {
    return new ChangesetExtendedDataOperations(this._operationsOptions);
  }

  /** Changeset Group operations. See {@link ChangesetGroupOperations}. */
  public override get changesetGroups(): ChangesetGroupOperations<OperationOptions> {
    return new ChangesetGroupOperations(this._operationsOptions, this);
  }

  /** Lock operations. See {@link LockOperations}. */
  public get locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  private static fillAuthoringClientConfiguration(
    options: IModelsClientOptions
  ): RecursiveRequired<IModelsClientOptions> {
    const retryPolicy =
      options?.retryPolicy ??
      new AxiosRetryPolicy({
        maxRetries: Constants.retryPolicy.maxRetries,
        backoffAlgorithm: new ExponentialBackoffAlgorithm({
          baseDelayInMs: Constants.retryPolicy.baseDelayInMs,
          factor: Constants.retryPolicy.delayFactor,
        }),
      });

    return {
      api: this.fillApiConfiguration(options?.api),
      restClient: options.restClient ?? new AxiosRestClient(retryPolicy),
      localFileSystem: options.localFileSystem ?? new NodeLocalFileSystem(),
      headers: options.headers ?? {},
      cloudStorage: options.cloudStorage,
      retryPolicy,
    };
  }
}
