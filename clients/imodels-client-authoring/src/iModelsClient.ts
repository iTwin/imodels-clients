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
import {iModelsApiUrlFormatter} from "./operations/iModelsApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";

export interface iModelsClientOptions extends ManagementiModelsClientOptions {
  fileHandler?: FileHandler;
}

export class iModelsClient {
  private _operationsOptions: OperationOptions;

  constructor(options?: iModelsClientOptions) {
    const fillediModelsClientOptions = iModelsClient.fillConfiguration(options);
    this._operationsOptions = {
      ...fillediModelsClientOptions,
      urlFormatter: new iModelsApiUrlFormatter(fillediModelsClientOptions.api.baseUri)
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

  public get Locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  public static fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
    return {
      ...ManagementiModelsClient.fillConfiguration(options),
      fileHandler: options?.fileHandler ?? new AzureSdkFileHandler()
    };
  }
}
