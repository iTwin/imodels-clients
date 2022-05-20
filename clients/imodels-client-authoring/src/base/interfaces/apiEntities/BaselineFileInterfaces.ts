/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Link } from "@itwin/imodels-client-management";

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

/** Links that belong to Baseline File entity. */
export interface BaselineFileLinks {
  /** Link to the user who created the baseline file instance. */
  creator: Link;
  /** Link from where to download the Baseline file. Link points to a remote storage. */
  download: Link | null;
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
  /** Baseline file links. See {@link BaselineFileLinks}. */
  _links: BaselineFileLinks;
}

/** DTO to hold a single Baseline file API response. */
export interface BaselineFileResponse {
  baselineFile: BaselineFile;
}
