/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export enum iModelsErrorCode {
  Unrecognized = "Unrecognized",

  // Common errors returned by API
  Unknown = "Unknown",
  Unauthorized = "Unauthorized",

  // Operation specific errors returned by the API
  InvalidiModelsRequest = "InvalidiModelsRequest",
  InvalidValue = "InvalidValue",
  iModelExists = "iModelExists",
  FileNotFound = "FileNotFound",
  ChangesetNotFound = "ChangesetNotFound",

  // Operation specific errors thrown by the client library
  BaselineFileInitializationFailed = "BaselineFileInitializationFailed",
  ChangesetDownloadFailed = "ChangesetDownloadFailed" // TODO: probably too specific
}

export interface iModelsError extends Error {
  code: iModelsErrorCode;
  details?: iModelsErrorDetail[];
}

export interface iModelsErrorDetail {
  code: iModelsErrorCode;
  message: string;
  target?: string;
}
