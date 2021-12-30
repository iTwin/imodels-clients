/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Supported Lock levels. */
export enum LockLevel {
  /** Objects are not locked. This level is used for releasing already acquired locks. */
  None = "none",
  /** Multiple Briefcases can acquire a shared lock on the same object. */
  Shared = "shared",
  /** Only one Briefcase can acquire an exclusive lock on a given object at a time. */
  Exclusive = "exclusive"
}

/** A group of locked objects that have the same lock level. */
export interface LockedObjects {
  /** Lock level that the objects are locked with. See {@link LockLevel}. */
  lockLevel: LockLevel;
  /** Locked object ids. */
  objectIds: string[];
}

/** Full representation of a Lock. */
export interface Lock {
  /** Id of the Briefcase that locks the specified objects. */
  briefcaseId: number;
  /** Ids of the locked objects grouped by their lock level. See {@link LockedObjects}. */
  lockedObjects: LockedObjects[];
}

/** DTO to hold a single Lock API response. */
export interface LockResponse {
  lock: Lock;
}

/** DTO to hold Lock list API response. */
export interface LocksResponse {
  locks: Lock[];
}
