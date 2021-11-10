/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export enum BaselineFileState {
  Initialized = "initialized",
  WaitingForFile = "waitingForFile",
  InitializationScheduled = "initializationScheduled",
  InitializationFailed = "initializationFailed",
  FileIsBriefcase = "fileIsBriefcase",
}

export interface BaselineFile {
  id: string;
  displayName: string;
  state: BaselineFileState;
}

export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
