/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "@itwin/imodels-client-management";

import { BaselineFile, Lock } from "../types";

export interface LocksResponse extends CollectionResponse {
  locks: Lock[];
}

export interface LockResponse {
  lock: Lock;
}

export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
