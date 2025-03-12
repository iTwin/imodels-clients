/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible error codes. */
export enum IModelsErrorCode {
  BaselineFileInitializationFailed = "BaselineFileInitializationFailed",
  BaselineFileInitializationTimedOut = "BaselineFileInitializationTimedOut",
  BaselineFileNotFound = "BaselineFileNotFound",
  BriefcaseNotFound = "BriefcaseNotFound",
  ChangesetDownloadFailed = "ChangesetDownloadFailed",
  ChangesetExists = "ChangesetExists",
  ChangesetExtendedDataNotFound = "ChangesetExtendedDataNotFound",
  ChangesetGroupNotFound = "ChangesetGroupNotFound",
  ChangesetNotFound = "ChangesetNotFound",
  CheckpointNotFound = "CheckpointNotFound",
  ClonedIModelInitializationFailed = "ClonedIModelInitializationFailed",
  ClonedIModelInitializationTimedOut = "ClonedIModelInitializationTimedOut",
  ConflictWithAnotherUser = "ConflictWithAnotherUser",
  DataConflict = "DataConflict",
  DownloadAborted = "DownloadAborted",
  EmptyIModelInitializationFailed = "EmptyIModelInitializationFailed",
  FileNotFound = "FileNotFound",
  IModelExists = "iModelExists",
  IModelForkInitializationFailed = "IModelForkInitializationFailed",
  IModelForkInitializationTimedOut = "IModelForkInitializationTimedOut",
  IModelFromTemplateInitializationFailed = "IModelFromTemplateInitializationFailed",
  IModelFromTemplateInitializationTimedOut = "IModelFromTemplateInitializationTimedOut",
  IModelNotFound = "iModelNotFound",
  InsufficientPermissions = "InsufficientPermissions",
  InvalidChange = "InvalidChange",
  InvalidHeaderValue = "InvalidHeaderValue",
  InvalidIModelGCSCreationMode = "InvalidIModelGCSCreationMode",
  InvalidIModelsRequest = "InvalidiModelsRequest",
  InvalidRequestBody = "InvalidRequestBody",
  InvalidThumbnailFormat = "InvalidThumbnailFormat",
  InvalidValue = "InvalidValue",
  ITwinNotFound = "iTwinNotFound",
  LockNotFound = "LockNotFound",
  MainIModelIsMissingFederationGuids = "MainIModelIsMissingFederationGuids",
  MaximumNumberOfBriefcasesPerUser = "MaximumNumberOfBriefcasesPerUser",
  MissingRequestBody = "MissingRequestBody",
  MissingRequiredHeader = "MissingRequiredHeader",
  MissingRequiredParameter = "MissingRequiredParameter",
  MissingRequiredProperty = "MissingRequiredProperty",
  MutuallyExclusiveParametersProvided = "MutuallyExclusiveParametersProvided",
  MutuallyExclusivePropertiesProvided = "MutuallyExclusivePropertiesProvided",
  NamedVersionNotFound = "NamedVersionNotFound",
  NamedVersionOnChangesetExists = "NamedVersionOnChangesetExists",
  NewerChangesExist = "NewerChangesExist",
  RateLimitExceeded = "RateLimitExceeded",
  RequestTooLarge = "RequestTooLarge",
  ResourceQuotaExceeded = "ResourceQuotaExceeded",
  TooManyRequests = "TooManyRequests",
  Unauthorized = "Unauthorized",
  Unknown = "Unknown",
  Unrecognized = "Unrecognized",
  UserNotFound = "UserNotFound",
  VersionExists = "NamedVersionExists"
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

/**
 * Original error that is thrown from `RestClient` implementation in case of http failure.
 * This error can be platform-dependent and vary based on `RestClient` implementation, so users should be
 * careful when implementing error handling.
 */
export interface IModelsOriginalError extends Error {
  /** Original error code. */
  code?: string;
}

/** Base interface for all errors returned from iModels API. */
export interface IModelsErrorBase extends Error {
  /** Error code. See {@link iModelsErrorCode}. */
  code: IModelsErrorCode;
  /** Original error thrown when sending http request. */
  originalError?: IModelsOriginalError;
}

/**
 * Most common error returned in the majority of error cases by iModels API and the only error returned from iModels
 * API operations that are surfaced in this library. Other types of errors may be returned from libraries that extend
 * this one.
 */
export interface IModelsError extends IModelsErrorBase {
  /** Data that describes the error in more detail. See {@link iModelsErrorDetail}. */
  details?: IModelsErrorDetail[];
  /** HTTP response status code. */
  statusCode?: number;
}

export function isIModelsApiError(error: unknown): error is IModelsError {
  const errorCode: unknown = (error as IModelsError)?.code;
  return errorCode !== undefined && typeof errorCode === "string";
}
