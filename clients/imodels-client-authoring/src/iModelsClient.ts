/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  iModelsClient as ManagementiModelsClient,
  iModelsClientOptions as ManagementiModelsClientOptions,
  NamedVersionOperations,
  RecursiveRequired
} from "@itwin/imodels-client-management";
import { AzureSdkFileHandler, FileHandler } from "./base";
import { BriefcaseOperations, ChangesetOperations, CheckpointOperations, iModelOperations } from "./operations";

export interface iModelsClientOptions extends ManagementiModelsClientOptions {
  fileHandler?: FileHandler;
}

export class iModelsClient {
  private _options: RecursiveRequired<iModelsClientOptions>;

  constructor(options?: iModelsClientOptions) {
    this._options = iModelsClient.fillConfiguration(options);
  }

  public get iModels(): iModelOperations {
    return new iModelOperations(this._options);
  }

  public get Briefcases(): BriefcaseOperations {
    return new BriefcaseOperations(this._options);
  }

  public get Changesets(): ChangesetOperations {
    return new ChangesetOperations(this._options);
  }

  public get NamedVersions(): NamedVersionOperations {
    return new NamedVersionOperations(this._options);
  }

  public get Checkpoints(): CheckpointOperations {
    return new CheckpointOperations(this._options);
  }

  public static fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
    return {
      ...ManagementiModelsClient.fillConfiguration(options),
      fileHandler: options?.fileHandler ?? new AzureSdkFileHandler()
    };
  }
}
