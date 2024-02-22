/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link } from "../CommonInterfaces";

import { User } from "./UserInterfaces";

/** Possible Changeset Group states. */
export enum ChangesetGroupState {
  /** Changeset Group is in progress and Changesets can be pushed to it. */
  InProgress = "inProgress",
  /** Changeset Group is closed and Changesets cannot be pushed to it anymore. */
  Completed = "completed",
  /** Changeset Group was not completed within the specified timeout period so it was closed by the service. */
  TimedOut = "timedOut",
  /** Changeset group was forcibly closed before cloning to the target iModel. */
  ForciblyClosed = "forciblyClosed"
}

/** Links that belong to a Changeset Group entity returned from iModels API. */
export interface ChangesetGroupLinks {
  /** Link to the User which created the Changeset Group. Link points to a specific User in iModels API. */
  creator: Link | null;
}

/** Changeset Group. */
export interface ChangesetGroup {
  /** Changeset Group id. */
  id: string;
  /** Changeset Group description. */
  description: string;
  /** Changeset Group state. See {@link ChangesetGroupState}. */
  state: ChangesetGroupState;
  /** Id of the user who created the Changeset Group. */
  creatorId: string;
  /** Datetime string of when the Changeset Group was created. */
  createdDateTime: string;
  /** Changeset Group links. See {@link ChangesetGroupLinks}. */
  _links: ChangesetGroupLinks;
  /**
   * Function to query User who created the Changeset Group. If the information is not present the
   * function returns `undefined`. This function reuses authorization information passed to specific Changeset Group
   * operation that originally queried the Changeset Group from API.
   */
  getCreator: () => Promise<User | undefined>;
}
