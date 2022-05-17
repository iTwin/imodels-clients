/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ClientStorage } from "@itwin/object-storage-core";
import { OperationOptions as ManagementOperationOptions } from "@itwin/imodels-client-management";
import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter";
import { LocalFileSystem } from "../base";

export interface OperationOptions extends ManagementOperationOptions {
  urlFormatter: IModelsApiUrlFormatter;
  localFs: LocalFileSystem;
  storage: ClientStorage; // TODO: rename to cloudStorage
}
