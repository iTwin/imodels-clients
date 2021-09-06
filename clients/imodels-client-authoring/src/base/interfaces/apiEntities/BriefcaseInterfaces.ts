/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity } from "@itwin/imodels-client-management";

export interface Briefcase extends BaseEntity {
  briefcaseId: number;
  acquiredDateTime: Date;
  fileSize: number;
  deviceName?: string;
}

export interface BriefcaseAcquireResponse {
  briefcase: Briefcase;
}