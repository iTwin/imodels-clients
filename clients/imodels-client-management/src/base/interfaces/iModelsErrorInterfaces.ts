/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible error codes. */
export enum iModelsErrorCode {
  Unrecognized = "Unrecognized",

  Unknown = "Unknown",
  Unauthorized = "Unauthorized",
  InsufficientPermissions = "InsufficientPermissions",
  RateLimitExceeded = "RateLimitExceeded",
  TooManyRequests = "TooManyRequests",
  InvalidiModelsRequest = "InvalidiModelsRequest",
  RequestTooLarge = "RequestTooLarge",
  ResourceQuotaExceeded = "ResourceQuotaExceeded",
  DataConflict = "DataConflict",
  MutuallyExclusivePropertiesProvided = "MutuallyExclusivePropertiesProvided",
  MissingRequiredProperty = "MissingRequiredProperty",
  MissingRequiredParameter = "MissingRequiredParameter",
  MissingRequiredHeader = "MissingRequiredHeader",
  InvalidValue = "InvalidValue",
  InvalidHeaderValue = "InvalidHeaderValue",
  InvalidRequestBody = "InvalidRequestBody",
  MissingRequestBody = "MissingRequestBody",
  ConflictWithAnotherUser = "ConflictWithAnotherUser",
  InvalidChange = "InvalidChange",
  iModelExists = "iModelExists",
  VersionExists = "NamedVersionExists",
  ChangesetExists = "ChangesetExists",
  NamedVersionOnChangesetExists = "NamedVersionOnChangesetExists",
  ProjectNotFound = "ProjectNotFound",
  iModelNotFound = "iModelNotFound",
  NamedVersionNotFound = "NamedVersionNotFound",
  ChangesetNotFound = "ChangesetNotFound",
  UserNotFound = "UserNotFound",
  BriefcaseNotFound = "BriefcaseNotFound",
  MaximumNumberOfBriefcasesPerUser = "MaximumNumberOfBriefcasesPerUser",
  FileNotFound = "FileNotFound",
  BaselineFileNotFound = "BaselineFileNotFound",
  CheckpointNotFound = "CheckpointNotFound",
  LockNotFound = "LockNotFound",
  NewerChangesExist = "NewerChangesExist",
  InvalidThumbnailFormat = "InvalidThumbnailFormat",

  BaselineFileInitializationFailed = "BaselineFileInitializationFailed",
  ChangesetDownloadFailed = "ChangesetDownloadFailed"
}

/** Error detail information. */
export interface iModelsErrorDetail {
  /** Error detail code. See {@link iModelsErrorCode}. */
  code: iModelsErrorCode;
  /** Message that describes the error detail. */
  message: string;
  /** Name of the property or parameter which is related to the issue. */
  target?: string;
}

/** Interface for the errors thrown by this library. */
export interface iModelsError extends Error {
  /** Error code. See {@link iModelsErrorCode}. */
  code: iModelsErrorCode;
  /** Information that describes the error in more detail. See {@link iModelsErrorDetail}. */
  details?: iModelsErrorDetail[];
}
