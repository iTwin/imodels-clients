/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link } from "../CommonInterfaces";

/** Links that belong to Minimal User entity. */
export interface MinimalUserLinks {
  /** Link to the current User entity. */
  self: Link | null;
}

/** Minimal representation of a User. */
export interface MinimalUser {
  /** User id. */
  id: string;
  /** User display name. Corresponds to {@link User.email} property. */
  displayName: string;
  /** Minimal User links. See {@link MinimalUserLinks}. */
  _links: MinimalUserLinks;
}

/** User Statistics */
export interface UserStatistics {
  /** Number of Changesets pushed by the user. */
  pushedChangesetsCount: number;
  /** Universal datetime value of the last time a Changeset was pushed to the iModel by the user. */
  lastChangesetPushDate: string | null;
  /** Number of Named Versions created by the user. */
  createdVersionsCount: number;
  /** Number of Briefcases owned by the user. */
  briefcasesCount: number;
  /** User Statistics grouped by application. */
  applications: UserApplicationStatistics[];
}

/** User Statistics grouped by application. */
export interface UserApplicationStatistics {
  /** Application id. */
  id: string | null;
  /** Application name. */
  name: string | null;
  /** Indicates if this user owns any locks with a briefcase acquired by this application. */
  ownsLocks: boolean;
  /** Indicates if this user owns an exclusive repository model lock with a briefcase acquired by this application. */
  ownsExclusiveRootElementLock: boolean;
}

/** Full representation of a User. */
export interface User extends MinimalUser {
  /** User given name. */
  givenName: string;
  /** User surname. */
  surname: string;
  /** User email address. */
  email: string;
  /** User Statistics */
  statistics: UserStatistics;
}
