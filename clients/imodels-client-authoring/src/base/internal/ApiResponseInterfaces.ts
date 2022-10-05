/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaselineFile, Lock } from "../types";

export interface LocksResponse {
  locks: Lock[];
}

export interface LockResponse {
  lock: Lock;
}

export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
