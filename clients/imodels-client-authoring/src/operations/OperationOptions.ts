/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationOptions as ManagementOperationOptions } from "@itwin/imodels-client-management";

import { ClientStorage } from "@itwin/object-storage-core";

import { LocalFileSystem } from "../base/types";

import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter";

export interface OperationOptions extends ManagementOperationOptions {
  urlFormatter: IModelsApiUrlFormatter;
  localFileSystem: LocalFileSystem;
  cloudStorage: ClientStorage;
}
