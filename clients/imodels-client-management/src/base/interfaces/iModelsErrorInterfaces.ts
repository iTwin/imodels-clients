/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export enum IModelsErrorCode {
  Unrecognized = "Unrecognized",

  // Errors returned by API
  Unknown = "Unknown",
  Unauthorized = "Unauthorized",
  InsufficientPermissions = "InsufficientPermissions",
  RateLimitExceeded = "RateLimitExceeded",
  TooManyRequests = "TooManyRequests",
  InvalidIModelsRequest = "InvalidiModelsRequest",
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
  IModelExists = "iModelExists",
  VersionExists = "NamedVersionExists",
  ChangesetExists = "ChangesetExists",
  NamedVersionOnChangesetExists = "NamedVersionOnChangesetExists",
  ProjectNotFound = "ProjectNotFound",
  IModelNotFound = "iModelNotFound",
  NamedVersionNotFound  = "NamedVersionNotFound",
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

  // Operation specific errors thrown by the client library
  BaselineFileInitializationFailed = "BaselineFileInitializationFailed",
  ChangesetDownloadFailed = "ChangesetDownloadFailed"
}

export interface IModelsError extends Error {
  code: IModelsErrorCode;
  details?: IModelsErrorDetail[];
}

export interface IModelsErrorDetail {
  code: IModelsErrorCode;
  message: string;
  target?: string;
}
