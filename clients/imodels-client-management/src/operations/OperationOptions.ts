/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBaseOptions } from "../base/internal";

import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter";

export interface OperationOptions extends OperationsBaseOptions {
  urlFormatter: IModelsApiUrlFormatter;
}
