/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ITwinError } from "@itwin/core-bentley";

import { ConflictingLock } from "@itwin/imodels-client-authoring";
import { IModelsError, IModelsErrorCode, IModelsErrorScope, isIModelsApiError } from "@itwin/imodels-client-management";

import { ConflictingLocksError } from "./IModelsClientsErrorInterfaces.js";

export type OperationNameForErrorMapping
  = "acquireBriefcase"
  | "downloadChangesets"
  | "updateLocks"
  | "createChangeset";

export class ErrorAdapter {
  public static toITwinError(error: unknown, operationName?: OperationNameForErrorMapping): unknown {
    if (!isIModelsApiError(error))
      return error;

    if (error.code === IModelsErrorCode.Unrecognized)
      return error;

    if (ErrorAdapter.isAPIAuthError(error.code))
      return error;
    if (ErrorAdapter.isIncorrectAPIUsageError(error.code))
      return error;
    if (ErrorAdapter.isAPIErrorWithoutCorrespondingStatus(error.code))
      return error;

    if (error.code === IModelsErrorCode.InvalidIModelsRequest)
      return ErrorAdapter.adaptInvalidRequestErrorIfPossible(error);

    let errorCode = ErrorAdapter.tryMapGenericErrorCode(error.code, operationName);
    if (!errorCode)
      errorCode = ErrorAdapter.mapErrorCode(error.code);

    if ("conflictingLocks" in error)
      return ITwinError.create<ConflictingLocksError>({
        iTwinErrorId: {
          key: errorCode,
          scope: IModelsErrorScope
        },
        message: error.message,
        conflictingLocks: error.conflictingLocks as ConflictingLock[]
      });

    return ITwinError.create({ iTwinErrorId: { key: errorCode, scope: IModelsErrorScope }, message: error.message });
  }

  private static isAPIAuthError(apiErrorCode: IModelsErrorCode): boolean {
    switch (apiErrorCode) {
      case IModelsErrorCode.Unauthorized:
      case IModelsErrorCode.InsufficientPermissions:
        return true;
      default:
        return false;
    }
  }

  private static isIncorrectAPIUsageError(apiErrorCode: IModelsErrorCode): boolean {
    switch (apiErrorCode) {
      case IModelsErrorCode.TooManyRequests:
      case IModelsErrorCode.RequestTooLarge:
      case IModelsErrorCode.InvalidValue:
      case IModelsErrorCode.InvalidHeaderValue:
      case IModelsErrorCode.InvalidRequestBody:
      case IModelsErrorCode.InvalidThumbnailFormat:
      case IModelsErrorCode.MutuallyExclusivePropertiesProvided:
      case IModelsErrorCode.MutuallyExclusiveParametersProvided:
      case IModelsErrorCode.MissingRequestBody:
      case IModelsErrorCode.MissingRequiredProperty:
      case IModelsErrorCode.MissingRequiredParameter:
      case IModelsErrorCode.MissingRequiredHeader:
      case IModelsErrorCode.InvalidChange: // returned when, for example, user attempts to complete Baseline file upload while it is not in progress
      case IModelsErrorCode.DataConflict: // returned when, for example, user attempts to complete Baseline file upload and the declared file size does not match actual uploaded file size
        return true;
      default:
        return false;
    }
  }

  private static isAPIErrorWithoutCorrespondingStatus(apiErrorCode: IModelsErrorCode): boolean {
    switch (apiErrorCode) {
      case IModelsErrorCode.NamedVersionNotFound:
      case IModelsErrorCode.UserNotFound:
      case IModelsErrorCode.ChangesetGroupNotFound:
      case IModelsErrorCode.BaselineFileNotFound:
      case IModelsErrorCode.BaselineFileInitializationFailed:
      case IModelsErrorCode.IModelFromTemplateInitializationFailed:
      case IModelsErrorCode.EmptyIModelInitializationFailed:
      case IModelsErrorCode.ClonedIModelInitializationFailed:
      case IModelsErrorCode.ChangesetDownloadFailed:
        return true;
      default: return false;
    }
  }

  private static adaptInvalidRequestErrorIfPossible(originalError: IModelsError): IModelsError | ITwinError {
    if (!originalError.details)
      return originalError;

    for (const errorDetail of originalError.details)
      if (errorDetail.innerError?.code === IModelsErrorCode.MaximumNumberOfBriefcasesPerUser)
        return ITwinError.create<ITwinError>({
          iTwinErrorId: {
            key: IModelsErrorCode.MaximumNumberOfBriefcasesPerUser,
            scope: IModelsErrorScope
          },
          message: originalError.message
        });

    return originalError;
  }

  private static tryMapGenericErrorCode(
    apiErrorCode: IModelsErrorCode,
    operationName?: OperationNameForErrorMapping
  ): IModelsErrorCode | undefined {
    if (!operationName)
      return;

    if (apiErrorCode === IModelsErrorCode.RateLimitExceeded && operationName === "acquireBriefcase")
      return IModelsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute;

    if (apiErrorCode === IModelsErrorCode.DownloadAborted && operationName === "downloadChangesets")
      return IModelsErrorCode.DownloadCancelled;

    if (apiErrorCode === IModelsErrorCode.ConflictWithAnotherUser) {
      if (operationName === "createChangeset")
        return IModelsErrorCode.AnotherUserPushing;
      else if (operationName === "updateLocks")
        return IModelsErrorCode.LockOwnedByAnotherBriefcase;
    }

    return undefined;
  }

  private static mapErrorCode(apiErrorCode: IModelsErrorCode): IModelsErrorCode {
    switch (apiErrorCode) {
      case IModelsErrorCode.Unknown:
      case IModelsErrorCode.ITwinNotFound:
      case IModelsErrorCode.IModelNotFound:
      case IModelsErrorCode.ChangesetNotFound:
      case IModelsErrorCode.BriefcaseNotFound:
      case IModelsErrorCode.FileNotFound:
      case IModelsErrorCode.CheckpointNotFound:
      case IModelsErrorCode.LockNotFound:
      case IModelsErrorCode.IModelExists:
      case IModelsErrorCode.VersionExists:
      case IModelsErrorCode.ChangesetExists:
      case IModelsErrorCode.NamedVersionOnChangesetExists:
      case IModelsErrorCode.NewerChangesExist:
      case IModelsErrorCode.BaselineFileInitializationTimedOut:
      case IModelsErrorCode.IModelFromTemplateInitializationTimedOut:
      case IModelsErrorCode.ClonedIModelInitializationTimedOut:
        return apiErrorCode;

      default:
        return IModelsErrorCode.Unknown;
    }
  }
}
