/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationOptions as ManagementOperationOptions } from "@itwin/imodels-client-management";
import { FileHandler } from "../base";
import { iModelsApiUrlFormatter } from "./iModelsApiUrlFormatter";

export interface OperationOptions extends ManagementOperationOptions {
  urlFormatter: iModelsApiUrlFormatter;
  fileHandler: FileHandler;
}
