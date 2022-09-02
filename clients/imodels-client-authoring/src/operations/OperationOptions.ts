/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ClientStorage } from "@itwin/object-storage-core";

import { OperationOptions as ManagementOperationOptions } from "@itwin/imodels-client-management";

import { LocalFileSystem } from "../base/public";

import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter";

export interface OperationOptions extends ManagementOperationOptions {
  urlFormatter: IModelsApiUrlFormatter;
  localFileSystem: LocalFileSystem;
  cloudStorage: ClientStorage;
}
