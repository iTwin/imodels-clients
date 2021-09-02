/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  iModelsClientOptions as ManagementiModelsClientOptions,
  fillConfiguration as fillManagementiModelsClientConfiguration,
  RecursiveRequired
} from "@itwin/imodels-client-management";
import { FileHandler, AzureSdkFileHandler } from "./base";
import { iModelOperations } from "./operations/imodel/iModelOperations";

export interface iModelsClientOptions extends ManagementiModelsClientOptions {
  fileHandler?: FileHandler;
}

export class iModelsClient {
  private _options: RecursiveRequired<iModelsClientOptions>;

  constructor(options?: iModelsClientOptions) {
    this._options = fillConfiguration(options);
  }

  public get iModels(): iModelOperations {
    return new iModelOperations(this._options);
  }
}

export function fillConfiguration(options?: iModelsClientOptions): RecursiveRequired<iModelsClientOptions> {
  return {
    ...fillManagementiModelsClientConfiguration(options),
    fileHandler: options?.fileHandler ?? new AzureSdkFileHandler(),
  };
}
