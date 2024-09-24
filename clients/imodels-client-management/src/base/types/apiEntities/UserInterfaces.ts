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

/** User statistics */
export interface UserStatistics {
  /** Number of changesets pushed by the user. */
  pushedChangesetsCount: number;
  /** Universal datetime value of the last time a changeset was pushed to the iModel by the user. */
  lastChangesetPushDate: string;
  /** Number of named versions created by the user. */
  createdVersionsCount: number;
  /** Number of briefcases owned by the user. */
  briefcasesCount: number;
}

/** Full representation of a User. */
export interface User extends MinimalUser {
  /** User given name. */
  givenName: string;
  /** User surname. */
  surname: string;
  /** User email address. */
  email: string;
  /** User statistics */
  statistics: UserStatistics;
}
