/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// TODO: see where what props are optonal
export enum LockLevel {
  None = "none",
  Shared = "shared",
  Exclusive = "exclusive"
}

export interface LockedObjects {
  lockLevel: LockLevel;
  objectIds: string[];
}

export interface Lock {
  briefcaseId: number;
  lockedObjects: LockedObjects[];
}

export interface LockResponse {
  lock: Lock;
}

export interface LocksResponse {
  locks: Lock[];
}
