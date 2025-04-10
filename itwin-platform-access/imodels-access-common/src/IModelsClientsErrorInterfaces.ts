/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ITwinError } from "@itwin/core-bentley";

import { ConflictingLock, IModelsErrorScope } from "@itwin/imodels-client-authoring";

/** Most common error returned in the majority of error cases by imodels-clients. */
export interface IModelsClientsError extends ITwinError {
  /** Unique identifier of error kind. */
  iTwinErrorId: {
    /** The scope for all imodels-clients errors. */
    scope: "imodels-clients";
    /** The key identifying error type */
    key: string;
  };
}

/** Error thrown by Lock update operation in case Locks cannot be updated because of conflicts with other Briefcases. */
export interface ConflictingLocksError extends IModelsClientsError {
  /** List of locks that are causing the conflicts. */
  conflictingLocks: ConflictingLock[];
}

export function isIModelsClientsError(error: unknown, key?: string): error is IModelsClientsError {
  return ITwinError.isError(error, IModelsErrorScope, key);
}

export function isConflictingLocksError(error: unknown): error is ConflictingLocksError {
  return ITwinError.isError<ConflictingLocksError>(error, IModelsErrorScope) && "conflictingLocks" in error;
}
