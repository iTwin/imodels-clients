import { ChangeSetStatus, IModelHubStatus } from "@itwin/core-bentley";
import { IModelError } from "@itwin/core-common";
import { IModelsErrorCode, isIModelsApiError } from "@itwin/imodels-client-authoring";

export type OperationNameForErrorMapping = "acquireBriefcase" | "downloadChangesets" | undefined;

export class ErrorAdapter {
  public static toIModelError(error: unknown, operationName: OperationNameForErrorMapping): unknown {
    if (!isIModelsApiError(error))
      return error;

    if (ErrorAdapter.isUnknownAPIError(error.code)) return error;
    if (ErrorAdapter.isAPIAuthError(error.code)) return error;
    if (ErrorAdapter.isIncorrectAPIUsageError(error.code)) return error;
    if (ErrorAdapter.isAPIErrorWithoutCorrespondingStatus(error.code)) return error;

    const errorNumber = ErrorAdapter.toErrorNumber(
      error.code,
      operationName
    );

    return new IModelError(errorNumber, error.message);
  }

  private static isUnknownAPIError(apiErrorCode: IModelsErrorCode): boolean {
    switch (apiErrorCode) {
      case IModelsErrorCode.Unrecognized:
      case IModelsErrorCode.Unknown:
        return true;
      default:
        return false;
    }
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
      case IModelsErrorCode.InvalidIModelsRequest:
      case IModelsErrorCode.InvalidValue:
      case IModelsErrorCode.InvalidHeaderValue:
      case IModelsErrorCode.InvalidRequestBody:
      case IModelsErrorCode.InvalidThumbnailFormat:
      case IModelsErrorCode.MutuallyExclusivePropertiesProvided:
      case IModelsErrorCode.MissingRequestBody:
      case IModelsErrorCode.MissingRequiredProperty:
      case IModelsErrorCode.MissingRequiredParameter:
      case IModelsErrorCode.MissingRequiredHeader:
      // returned when, for example, user attempts to complete Baseline file upload while it is not in progress
      case IModelsErrorCode.InvalidChange:
      // returned when, for example, user attempts to complete Baseline file upload and the declared file size does not match actual uploaded file size
      case IModelsErrorCode.DataConflict:
        return true;
      default:
        return false;
    }
  }

  private static isAPIErrorWithoutCorrespondingStatus(apiErrorCode: IModelsErrorCode): boolean {
    switch (apiErrorCode) {
      case IModelsErrorCode.NamedVersionNotFound:
      case IModelsErrorCode.UserNotFound:
      case IModelsErrorCode.BaselineFileNotFound:
      case IModelsErrorCode.BaselineFileInitializationFailed:
      case IModelsErrorCode.IModelFromTemplateInitializationFailed:
      case IModelsErrorCode.ChangesetDownloadFailed:
        return true;
      default: return false;
    }
  }

  private static toErrorNumber(apiErrorCode: IModelsErrorCode, operationName: OperationNameForErrorMapping): IModelHubStatus | ChangeSetStatus {
    if (apiErrorCode === IModelsErrorCode.ResourceQuotaExceeded && operationName === "acquireBriefcase")
      return IModelHubStatus.MaximumNumberOfBriefcasesPerUser;

    if (apiErrorCode === IModelsErrorCode.RateLimitExceeded && operationName === "acquireBriefcase")
      return IModelHubStatus.MaximumNumberOfBriefcasesPerUserPerMinute;

    if (apiErrorCode === IModelsErrorCode.DownloadAborted && operationName == "downloadChangesets")
      return ChangeSetStatus.DownloadCancelled;

    switch (apiErrorCode) {
      case IModelsErrorCode.ConflictWithAnotherUser:
        return IModelHubStatus.AnotherUserPushing;
      case IModelsErrorCode.IModelExists:
        return IModelHubStatus.iModelAlreadyExists;
      case IModelsErrorCode.VersionExists:
        return IModelHubStatus.VersionAlreadyExists;
      case IModelsErrorCode.ChangesetExists:
        return IModelHubStatus.ChangeSetAlreadyExists;
      case IModelsErrorCode.NamedVersionOnChangesetExists:
        return IModelHubStatus.ChangeSetAlreadyHasVersion
      case IModelsErrorCode.ITwinNotFound:
        return IModelHubStatus.ITwinDoesNotExist;
      case IModelsErrorCode.IModelNotFound:
        return IModelHubStatus.iModelDoesNotExist;
      case IModelsErrorCode.ChangesetNotFound:
        return IModelHubStatus.ChangeSetDoesNotExist
      case IModelsErrorCode.BriefcaseNotFound:
        return IModelHubStatus.BriefcaseDoesNotExist;
      case IModelsErrorCode.MaximumNumberOfBriefcasesPerUser:
        return IModelHubStatus.MaximumNumberOfBriefcasesPerUser;
      case IModelsErrorCode.FileNotFound:
        return IModelHubStatus.FileDoesNotExist;
      case IModelsErrorCode.CheckpointNotFound:
        return IModelHubStatus.CheckpointDoesNotExist;
      case IModelsErrorCode.LockNotFound:
        return IModelHubStatus.LockDoesNotExist;
      case IModelsErrorCode.NewerChangesExist:
        return IModelHubStatus.PullIsRequired;
      case IModelsErrorCode.BaselineFileInitializationTimedOut:
        return IModelHubStatus.InitializationTimeout;
      default:
        return IModelHubStatus.Unknown;
    }
  }
}