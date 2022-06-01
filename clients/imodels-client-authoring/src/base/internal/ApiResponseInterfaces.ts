/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaselineFile, Lock } from "../public";

/** DTO to hold Lock list API response. */
export interface LocksResponse {
  locks: Lock[];
}

/** DTO to hold a single Lock API response. */
export interface LockResponse {
  lock: Lock;
}

/** DTO to hold a single Baseline file API response. */
export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
