/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export {
  /** @deprecated in 6.1. Use `LockResponse` from `@itwin/imodels-client-management` instead. */
  LockResponse,
  /** @deprecated in 6.1. Use `LocksResponse` from `@itwin/imodels-client-management` instead. */
  LocksResponse,
} from "@itwin/imodels-client-management";

import { BaselineFile } from "../types";

export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
