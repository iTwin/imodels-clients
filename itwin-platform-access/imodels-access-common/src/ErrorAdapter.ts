/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ChangeSetStatus, IModelHubStatus } from "@itwin/core-bentley";
import { IModelError } from "@itwin/core-common";

import { IModelsError, IModelsErrorCode, isIModelsApiError } from "@itwin/imodels-client-management";

export type OperationNameForErrorMapping = "acquireBriefcase" | "downloadChangesets";

export class ErrorAdapter {
  public static toIModelError(error: unknown, operationName?: OperationNameForErrorMapping): unknown {
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

    let errorNumber = ErrorAdapter.tryMapGenericErrorCode(error.code, operationName);
    if (!errorNumber)
      errorNumber = ErrorAdapter.mapErrorCode(error.code);

    return new IModelError(errorNumber, error.message);
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
      case IModelsErrorCode.ClonedIModelInitializationFailed:
      case IModelsErrorCode.ChangesetDownloadFailed:
        return true;
      default: return false;
    }
  }

  private static adaptInvalidRequestErrorIfPossible(originalError: IModelsError): IModelsError | IModelError {
    if (!originalError.details)
      return originalError;

    for (const errorDetail of originalError.details)
      if (errorDetail.innerError?.code === IModelsErrorCode.MaximumNumberOfBriefcasesPerUser)
        return new IModelError(IModelHubStatus.MaximumNumberOfBriefcasesPerUser, originalError.message);

    return originalError;
  }

  private static tryMapGenericErrorCode(
    apiErrorCode: IModelsErrorCode,
    operationName?: OperationNameForErrorMapping
  ): IModelHubStatus | ChangeSetStatus | undefined {
    if (!operationName)
      return;

    if (apiErrorCode === IModelsErrorCode.RateLimitExceeded && operationName === "acquireBriefcase")
      return IModelHubStatus.MaximumNumberOfBriefcasesPerUserPerMinute;

    if (apiErrorCode === IModelsErrorCode.DownloadAborted && operationName === "downloadChangesets")
      return ChangeSetStatus.DownloadCancelled;

    return undefined;
  }

  private static mapErrorCode(apiErrorCode: IModelsErrorCode): IModelHubStatus {
    switch (apiErrorCode) {
      case IModelsErrorCode.Unknown:
        return IModelHubStatus.OperationFailed;

      case IModelsErrorCode.ITwinNotFound:
        return IModelHubStatus.ITwinDoesNotExist;
      case IModelsErrorCode.IModelNotFound:
        return IModelHubStatus.iModelDoesNotExist;
      case IModelsErrorCode.ChangesetNotFound:
        return IModelHubStatus.ChangeSetDoesNotExist;
      case IModelsErrorCode.BriefcaseNotFound:
        return IModelHubStatus.BriefcaseDoesNotExist;
      case IModelsErrorCode.FileNotFound:
        return IModelHubStatus.FileDoesNotExist;
      case IModelsErrorCode.CheckpointNotFound:
        return IModelHubStatus.CheckpointDoesNotExist;
      case IModelsErrorCode.LockNotFound:
        return IModelHubStatus.LockDoesNotExist;

      case IModelsErrorCode.IModelExists:
        return IModelHubStatus.iModelAlreadyExists;
      case IModelsErrorCode.VersionExists:
        return IModelHubStatus.VersionAlreadyExists;
      case IModelsErrorCode.ChangesetExists:
        return IModelHubStatus.ChangeSetAlreadyExists;
      case IModelsErrorCode.NamedVersionOnChangesetExists:
        return IModelHubStatus.ChangeSetAlreadyHasVersion;

      case IModelsErrorCode.ConflictWithAnotherUser:
        return IModelHubStatus.AnotherUserPushing;
      case IModelsErrorCode.NewerChangesExist:
        return IModelHubStatus.PullIsRequired;
      case IModelsErrorCode.BaselineFileInitializationTimedOut:
      case IModelsErrorCode.IModelFromTemplateInitializationTimedOut:
      case IModelsErrorCode.ClonedIModelInitializationTimedOut:
        return IModelHubStatus.InitializationTimeout;

      default:
        return IModelHubStatus.Unknown;
    }
  }
}
