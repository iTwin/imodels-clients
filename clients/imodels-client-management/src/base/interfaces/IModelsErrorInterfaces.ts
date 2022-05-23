/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible error codes. */
export enum IModelsErrorCode {
  Unrecognized = "Unrecognized",

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

  BaselineFileInitializationFailed = "BaselineFileInitializationFailed",
  IModelFromTemplateInitializationFailed = "IModelFromTemplateInitializationFailed",
  ChangesetDownloadFailed = "ChangesetDownloadFailed"
}

/** Error detail information. */
export interface IModelsErrorDetail {
  /** Error detail code. See {@link IModelsErrorCode}. */
  code: IModelsErrorCode;
  /** Message that describes the error detail. */
  message: string;
  /** Name of the property or parameter which is related to the issue. */
  target?: string;
}

/** Interface for the errors thrown by this library. */
export interface IModelsError extends Error {
  /** Error code. See {@link iModelsErrorCode}. */
  code: IModelsErrorCode;
  /** Data that describes the error in more detail. See {@link iModelsErrorDetail}. */
  details?: IModelsErrorDetail[];
}
