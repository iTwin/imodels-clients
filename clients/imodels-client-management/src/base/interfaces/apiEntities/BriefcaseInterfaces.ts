/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "../CommonInterfaces";

export interface MinimalBriefcase {
  id: string;
  displayName: string;
}

export interface Briefcase extends MinimalBriefcase {
  briefcaseId: number;
  ownerId: string;
  acquiredDateTime: Date;
  fileSize: number;
  deviceName: string | null;
}

export interface BriefcaseResponse {
  briefcase: Briefcase;
}

export interface BriefcasesResponse<TBriefcase extends MinimalBriefcase> extends CollectionResponse {
  briefcases: TBriefcase[];
}
