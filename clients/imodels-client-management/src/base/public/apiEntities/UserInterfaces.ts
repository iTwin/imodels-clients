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

/** Full representation of a User. */
export interface User extends MinimalUser {
  /** User given name. */
  givenName: string;
  /** User surname. */
  surname: string;
  /** User email address. */
  email: string;
}
