/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  iModelsClientOptions as iModelsClientOptions_Management,
  fillConfiguration as fillManagementClientConfiguration,
  RecursiveRequired
} from "@itwin/imodels-client-management";
import { FileHandler, AzureSdkFileHandler } from "./base";
import { iModelOperations } from "./operations/imodel/iModelOperations";

export interface iModelsClientOptions extends iModelsClientOptions_Management {
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
    ...fillManagementClientConfiguration(options),
    fileHandler: options?.fileHandler ?? new AzureSdkFileHandler(),
  };
}
