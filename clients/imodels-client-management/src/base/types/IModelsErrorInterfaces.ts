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
  ITwinNotFound = "iTwinNotFound",
  IModelNotFound = "iModelNotFound",
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
  BaselineFileInitializationTimedOut = "BaselineFileInitializationTimedOut",
  IModelFromTemplateInitializationFailed = "IModelFromTemplateInitializationFailed",
  ChangesetDownloadFailed = "ChangesetDownloadFailed",
  DownloadAborted = "DownloadAborted"
}

/** Error detail information. */
export interface IModelsErrorDetail {
  /** Error detail code. See {@link IModelsErrorCode}. */
  code: IModelsErrorCode;
  /** Message that describes the error detail. */
  message: string;
  /** Name of the property or parameter which is related to the issue. */
  target?: string;
  /** Inner error that potentially narrows down the issue specified in the `IModelsErrorDetail.code` property. */
  innerError?: ErrorDetailInnerError;
}

/** Additional information that extends IModelsErrorDetail. See {@link IModelsErrorDetail} . */
export interface ErrorDetailInnerError {
  /** Error detail code. See {@link IModelsErrorCode}. */
  code: IModelsErrorCode;
}

/** Base interface for all errors returned from iModels API. */
export interface IModelsErrorBase extends Error {
  /** Error code. See {@link iModelsErrorCode}. */
  code: IModelsErrorCode;
}

/**
 * Most common error returned in the majority of error cases by iModels API and the only error returned from iModels
 * API operations that are surfaced in this library. Other types of errors may be returned from libraries that extend
 * this one.
 */
export interface IModelsError extends IModelsErrorBase {
  /** Data that describes the error in more detail. See {@link iModelsErrorDetail}. */
  details?: IModelsErrorDetail[];
}

export function isIModelsApiError(error: unknown): error is IModelsError {
  const errorCode: unknown = (error as IModelsError)?.code;
  return errorCode !== undefined && typeof errorCode === "string";
}
