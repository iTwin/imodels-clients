/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "reflect-metadata";

import { OperationOptions as ManagementOperationOptions } from "@itwin/imodels-client-management";
import { ClientStorage } from "@itwin/object-storage-core";

import { LocalFileSystem } from "../base/types/index.js";

import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter.js";

export interface OperationOptions extends ManagementOperationOptions {
  urlFormatter: IModelsApiUrlFormatter;
  localFileSystem: LocalFileSystem;
  cloudStorage: ClientStorage;
}
