/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
<<<<<<< HEAD:clients/imodels-client-management/src/base/interfaces/iModelsErrorInterfaces.ts

/** Possible error codes. */
export enum iModelsErrorCode {
=======
export enum IModelsErrorCode {
>>>>>>> 9e2fb6fa2ab090e211c16fccc7da86c3ebfb9542:clients/imodels-client-management/src/base/interfaces/IModelsErrorInterfaces.ts
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
<<<<<<< HEAD:clients/imodels-client-management/src/base/interfaces/iModelsErrorInterfaces.ts
  iModelNotFound = "iModelNotFound",
  NamedVersionNotFound = "NamedVersionNotFound",
=======
  IModelNotFound = "iModelNotFound",
  NamedVersionNotFound  = "NamedVersionNotFound",
>>>>>>> 9e2fb6fa2ab090e211c16fccc7da86c3ebfb9542:clients/imodels-client-management/src/base/interfaces/IModelsErrorInterfaces.ts
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

<<<<<<< HEAD:clients/imodels-client-management/src/base/interfaces/iModelsErrorInterfaces.ts
/** Error detail information. */
export interface iModelsErrorDetail {
  /** Error detail code. See {@link iModelsErrorCode}. */
  code: iModelsErrorCode;
  /** Message that describes the error detail. */
=======
export interface IModelsError extends Error {
  code: IModelsErrorCode;
  details?: IModelsErrorDetail[];
}

export interface IModelsErrorDetail {
  code: IModelsErrorCode;
>>>>>>> 9e2fb6fa2ab090e211c16fccc7da86c3ebfb9542:clients/imodels-client-management/src/base/interfaces/IModelsErrorInterfaces.ts
  message: string;
  /** Name of the property or parameter which is related to the issue. */
  target?: string;
}

/** Interface for the errors thrown by this library. */
export interface iModelsError extends Error {
  /** Error code. See {@link iModelsErrorCode}. */
  code: iModelsErrorCode;
  /** Data that describes the error in more detail. See {@link iModelsErrorDetail}. */
  details?: iModelsErrorDetail[];
}
