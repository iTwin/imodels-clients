/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Application, Link } from "../CommonInterfaces";

import { User } from "./UserInterfaces";

/** Minimal representation of a Briefcase. */
export interface MinimalBriefcase {
  /** Briefcase id in a string format. Value corresponds to {@link Briefcase.briefcaseId} property. */
  id: string;
  /** Briefcase display name. */
  displayName: string;
}

/** Links that belong to Briefcase entity. */
export interface BriefcaseLinks {
  /** Link to the User which acquired the Briefcase. Link points to a specific User in iModels API. */
  owner: Link;
}

export interface Briefcase extends MinimalBriefcase {
  /** Briefcase id in a number format. Value corresponds to {@link MinimalBriefcase.id} property. */
  briefcaseId: number;
  /** Id of the user which acquired the Briefcase. */
  ownerId: string;
  /** Datetime string of when the Briefcase was acquired. */
  acquiredDateTime: string;
  /** Size of the Briefcase in bytes. */
  fileSize: number;
  /** Name of the device which holds the Briefcase. */
  deviceName: string | null;
  /** Information about the application that acquired the Briefcase. */
  application: Application | null;
  /** Briefcase links. See {@link BriefcaseLinks}. */
  _links: BriefcaseLinks;
  /**
   * Function to query User who owns the Briefcase. If the information is not present the
   * function returns `undefined`. This function reuses authorization information passed to specific Briefcase
   * operation that originally queried the Briefcase from API.
   */
  getOwner: () => Promise<User | undefined>;
}
