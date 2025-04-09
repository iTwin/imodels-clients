/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsErrorBase } from "@itwin/imodels-client-management";

import { LockLevel } from "./LockInterfaces.js";

/** Error thrown by Lock update operation. */
export interface LocksError extends IModelsErrorBase {
  /** Object ids that are causing the Lock update error. */
  objectIds?: string[];
}

/**
 * Error thrown by Lock update operation in case Locks cannot be updated because of conflicts with other Briefcases.
 */
export interface ConflictingLocksError extends IModelsErrorBase {
  /** List of locks that are causing the conflicts. */
  conflictingLocks?: ConflictingLock[];
}

/** Detailed information about a particular object Lock that is causing the Lock update conflict. */
export interface ConflictingLock {
  /** Id of the object that is causing conflict. */
  objectId: string;
  /**
   * The level of conflicting lock. Possible values are {@link LockLevel.Shared}, {@link LockLevel.Exclusive}.
   * See {@link LockLevel}.
   */
  lockLevel: LockLevel;
  /** An array of Briefcase ids that hold this lock. */
  briefcaseIds: number[];
}
