/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "../CommonInterfaces";

/** Minimal representation of a Briefcase. */
export interface MinimalBriefcase {
  /** Briefcase id in a string format. The value corresponds to {@link Briefcase.briefcaseId} property. */
  id: string;
  /** Briefcase display name. */
  displayName: string;
}

export interface Briefcase extends MinimalBriefcase {
  /** Briefcase id in a number format. The value corresponds to {@link MinimalBriefcase.id} property. */
  briefcaseId: number;
  /** Id of the user which acquired the Briefcase. */
  ownerId: string;
  /** Datetime string when of when the Briefcase was acquired. */
  acquiredDateTime: string;
  /** Size of the Briefcase in bytes. */
  fileSize: number;
  /** Name of the device which holds the Briefcase. */
  deviceName: string | null;
}

/** DTO for single Briefcase API response. */
export interface BriefcaseResponse {
  briefcase: Briefcase;
}

/** DTO for Briefcase list API response. */
export interface BriefcasesResponse<TBriefcase extends MinimalBriefcase> extends CollectionResponse {
  briefcases: TBriefcase[];
}
