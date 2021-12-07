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
import { BriefcaseOperations, ChangesetOperations, IModelOperations, LockOperations } from "./operations";
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
      urlFormatter: new IModelsApiUrlFormatter(filledIModelsClientOptions.api.baseUrl)
    };
  }

  public get fileHandler(): FileHandler {
    return this._operationsOptions.fileHandler;
  }

  public get iModels(): IModelOperations<OperationOptions> {
    return new IModelOperations(this._operationsOptions);
  }

  public get briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions);
  }

  public get changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this.namedVersions, this.checkpoints);
  }

  public get namedVersions(): NamedVersionOperations<OperationOptions> {
    return new NamedVersionOperations(this._operationsOptions);
  }

  public get checkpoints(): CheckpointOperations<OperationOptions> {
    return new CheckpointOperations(this._operationsOptions);
  }

  public get locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  public static fillConfiguration(options?: IModelsClientOptions): RecursiveRequired<IModelsClientOptions> {
    return {
      ...ManagementIModelsClient.fillConfiguration(options),
      fileHandler: options?.fileHandler ?? new AzureSdkFileHandler()
    };
  }
}
