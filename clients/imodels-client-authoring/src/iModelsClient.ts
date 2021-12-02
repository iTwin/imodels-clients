/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CheckpointOperations,
  iModelsClient as ManagementiModelsClient,
  iModelsClientOptions as ManagementiModelsClientOptions,
  NamedVersionOperations,
  RecursiveRequired
} from "@itwin/imodels-client-management";
import { AzureSdkFileHandler, FileHandler } from "./base";
import { BriefcaseOperations, ChangesetOperations, LockOperations, iModelOperations } from "./operations";
import { iModelsApiUrlFormatter } from "./operations/iModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

/** User-configurable iModels client options. */
export interface iModelsClientOptions extends ManagementiModelsClientOptions {
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

  /** 
   * File handler that is used for file transfer operations. The handler is optionally configurable by user, 
   * see {@link iModelsClientOptions}.
   */
  public get FileHandler(): FileHandler {
    return this._operationsOptions.fileHandler;
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

  /** Lock operations. See {@link LockOperations}. */
  public get Locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  /** 
   * Creates a configuration from user-specified properties and default values. See {@link iModelsClientOptions}.
   * @param {iModelsClientOptions} options user-passed client options.
   * @returns {RecursiveRequired<iModelsClientOptions>} options with all the gaps filled with default values.
   */
  public static fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
    return {
      ...ManagementiModelsClient.fillConfiguration(options),
      fileHandler: options?.fileHandler ?? new AzureSdkFileHandler()
    };
  }
}
