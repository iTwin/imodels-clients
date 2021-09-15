/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity, CollectionResponse } from "../CommonInterfaces";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MinimalBriefcase extends BaseEntity {
}

export interface Briefcase extends MinimalBriefcase {
  briefcaseId: number;
  acquiredDateTime: Date;
  fileSize: number;
  deviceName?: string;
}

export interface BriefcaseResponse {
  briefcase: Briefcase;
}

export interface BriefcasesResponse<TBriefcase extends MinimalBriefcase> extends CollectionResponse {
  briefcases: TBriefcase[];
}