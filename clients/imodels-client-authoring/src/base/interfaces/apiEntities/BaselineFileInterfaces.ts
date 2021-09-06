/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity } from "@itwin/imodels-client-management";

export enum BaselineFileState { // TODO: add/update baseline file states when they're finalized
  Initialized = "initialized",
  WaitingForFile = "waitingForFile",
  InitializationScheduled = "initializationScheduled"
}

export interface BaselineFile extends BaseEntity {
  state: BaselineFileState;
}

export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
