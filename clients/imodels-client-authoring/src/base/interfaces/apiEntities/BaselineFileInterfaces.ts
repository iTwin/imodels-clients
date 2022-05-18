/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible Baseline file states. */
export enum BaselineFileState {
  /** Baseline file background initialization process has completed and iModel is ready to use. */
  Initialized = "initialized",
  /** Baseline file is not yet uploaded. */
  WaitingForFile = "waitingForFile",
  /** Baseline file background initialization process is scheduled. */
  InitializationScheduled = "initializationScheduled",
  /** Baseline file initialization has failed. */
  InitializationFailed = "initializationFailed",
  /** The uploaded Baseline file is a Briefcase and not a valid Baseline file. */
  FileIsBriefcase = "fileIsBriefcase",
}

/** Full representation of a Baseline file. */
export interface BaselineFile {
  /** Baseline file id. */
  id: string;
  /** Baseline file display name. */
  displayName: string;
  /** Baseline file size in bytes. */
  fileSize: number;
  /** Baseline file state. See {@link BaselineFileState}. */
  state: BaselineFileState;
}

/** DTO to hold a single Baseline file API response. */
export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
