/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  IModelsClient as ManagementIModelsClient,
  IModelsClientOptions as ManagementIModelsClientOptions,
  RecursiveRequired
} from "@itwin/imodels-client-management";
import { FileHandler } from "./base/public";
import { AzureSdkFileHandler } from "./base/internal";
import { BriefcaseOperations, ChangesetOperations, IModelOperations, LockOperations } from "./operations";
import { BaselineFileOperations } from "./operations/baseline-file/BaselineFileOperations";
import { IModelsApiUrlFormatter } from "./operations/IModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

/** User-configurable iModels client options. */
export interface IModelsClientOptions extends ManagementIModelsClientOptions {
  /**
   * File handler to use in operations which transfer files. Examples of such operations are Changeset download in
   * {@link ChangesetOperations}, iModel creation from Baseline in {@link iModelOperations}. If `undefined` the default
   * handler is used which is implemented using Azure SDK. See {@link AzureSdkFileHandler}.
   */
  fileHandler?: FileHandler;
}

/**
 * iModels API client for iModel authoring workflows. For more information on the API visit the
 * {@link https://developer.bentley.com/apis/imodels/ iModels API documentation page}.
 */
export class IModelsClient extends ManagementIModelsClient {
  protected override _operationsOptions: OperationOptions;

  /**
   * Class constructor.
   * @param {iModelsClientOptions} options client options. If `options` are `undefined` or if some of the properties
   * are `undefined` the client uses defaults. See {@link iModelsClientOptions}.
   */
  constructor(options?: IModelsClientOptions) {
    const filledIModelsClientOptions = IModelsClient.fillConfiguration(options);
    super(filledIModelsClientOptions);

    this._operationsOptions = {
      ...filledIModelsClientOptions,
      urlFormatter: new IModelsApiUrlFormatter(filledIModelsClientOptions.api.baseUrl)
    };
  }

  /**
   * File handler that is used for file transfer operations. This uses the user provided handler or default one,
   * see {@link iModelsClientOptions}.
   */
  public get fileHandler(): FileHandler {
    return this._operationsOptions.fileHandler;
  }

  /** iModel operations. See {@link iModelOperations}. */
  public override get iModels(): IModelOperations<OperationOptions> {
    return new IModelOperations(this._operationsOptions);
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

  /** Lock operations. See {@link LockOperations}. */
  public get locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  /**
   * Creates a required configuration instance from user provided options and applying default ones for not specified
   * options. See {@link iModelsClientOptions}.
   * @param {iModelsClientOptions} options user-passed client options.
   * @returns {RecursiveRequired<iModelsClientOptions>} required iModels client configuration options.
   */
  public static override fillConfiguration(options?: IModelsClientOptions): RecursiveRequired<IModelsClientOptions> {
    return {
      ...ManagementIModelsClient.fillConfiguration(options),
      fileHandler: options?.fileHandler ?? new AzureSdkFileHandler()
    };
  }
}
