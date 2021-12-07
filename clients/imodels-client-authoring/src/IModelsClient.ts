/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CheckpointOperations,
  IModelsClient as ManagementIModelsClient,
  IModelsClientOptions as ManagementIModelsClientOptions,
  NamedVersionOperations,
  RecursiveRequired
} from "@itwin/imodels-client-management";
import { AzureSdkFileHandler, FileHandler } from "./base";
import { BriefcaseOperations, ChangesetOperations, LockOperations, IModelOperations } from "./operations";
import { IModelsApiUrlFormatter } from "./operations/IModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

export interface IModelsClientOptions extends ManagementIModelsClientOptions {
  fileHandler?: FileHandler;
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

  public get FileHandler(): FileHandler {
    return this._operationsOptions.fileHandler;
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

  public get Locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  public static fillConfiguration(options?: IModelsClientOptions): RecursiveRequired<IModelsClientOptions> {
    return {
      ...ManagementIModelsClient.fillConfiguration(options),
      fileHandler: options?.fileHandler ?? new AzureSdkFileHandler()
    };
  }
}
