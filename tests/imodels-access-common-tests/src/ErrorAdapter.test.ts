/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangeSetStatus, IModelHubStatus } from "@itwin/core-bentley";
import { IModelError } from "@itwin/core-common";
import { ErrorAdapter, OperationNameForErrorMapping } from "@itwin/imodels-access-common/lib/ErrorAdapter";
import { IModelsErrorImpl, IModelsErrorParser } from "@itwin/imodels-client-management/lib/base/internal";
import { expect } from "chai";

import { IModelsErrorCode } from "@itwin/imodels-client-management";

describe("ErrorAdapter", () => {
  [
    { foo: "bar" },
    new IModelsErrorImpl({ code: 5 as any, message: "", originalError: undefined, statusCode: undefined, details: undefined })
  ].forEach((originalError: unknown) => {

    it("should return original error if it does not have a string error code", () => {
      const result = ErrorAdapter.toIModelError(originalError, undefined);

      expect(result).to.be.equal(originalError);
    });
  });

  [
    IModelsErrorCode.Unrecognized,

    IModelsErrorCode.Unauthorized,
    IModelsErrorCode.InsufficientPermissions,

    IModelsErrorCode.TooManyRequests,
    IModelsErrorCode.RequestTooLarge,
    IModelsErrorCode.InvalidIModelsRequest,
    IModelsErrorCode.InvalidValue,
    IModelsErrorCode.InvalidHeaderValue,
    IModelsErrorCode.InvalidRequestBody,
    IModelsErrorCode.InvalidThumbnailFormat,
    IModelsErrorCode.MutuallyExclusivePropertiesProvided,
    IModelsErrorCode.MutuallyExclusiveParametersProvided,
    IModelsErrorCode.MissingRequestBody,
    IModelsErrorCode.MissingRequiredProperty,
    IModelsErrorCode.MissingRequiredParameter,
    IModelsErrorCode.MissingRequiredHeader,
    IModelsErrorCode.InvalidChange,
    IModelsErrorCode.DataConflict,
    IModelsErrorCode.NamedVersionNotFound,
    IModelsErrorCode.UserNotFound,
    IModelsErrorCode.ChangesetGroupNotFound,
    IModelsErrorCode.BaselineFileNotFound,
    IModelsErrorCode.BaselineFileInitializationFailed,
    IModelsErrorCode.EmptyIModelInitializationFailed,
    IModelsErrorCode.IModelFromTemplateInitializationFailed,
    IModelsErrorCode.ClonedIModelInitializationFailed,
    IModelsErrorCode.ChangesetDownloadFailed
  ].forEach((originalErrorCode) => {

    it(`should return original error if error code is unrecognized, indicates auth issue or does not have a corresponding status in IModelHubStatus (${originalErrorCode})`, () => {
      const error = new IModelsErrorImpl({ code: originalErrorCode, message: "", originalError: new Error(), statusCode: undefined, details: undefined });

      const result = ErrorAdapter.toIModelError(error, undefined);

      expect(result).to.be.equal(error);
    });
  });

  [
    { originalErrorCode: IModelsErrorCode.Unknown, expectedErrorNumber: IModelHubStatus.OperationFailed },
    { originalErrorCode: IModelsErrorCode.ITwinNotFound, expectedErrorNumber: IModelHubStatus.ITwinDoesNotExist },
    { originalErrorCode: IModelsErrorCode.IModelNotFound, expectedErrorNumber: IModelHubStatus.iModelDoesNotExist },
    { originalErrorCode: IModelsErrorCode.ChangesetNotFound, expectedErrorNumber: IModelHubStatus.ChangeSetDoesNotExist },
    { originalErrorCode: IModelsErrorCode.BriefcaseNotFound, expectedErrorNumber: IModelHubStatus.BriefcaseDoesNotExist },
    { originalErrorCode: IModelsErrorCode.FileNotFound, expectedErrorNumber: IModelHubStatus.FileDoesNotExist },
    { originalErrorCode: IModelsErrorCode.CheckpointNotFound, expectedErrorNumber: IModelHubStatus.CheckpointDoesNotExist },
    { originalErrorCode: IModelsErrorCode.LockNotFound, expectedErrorNumber: IModelHubStatus.LockDoesNotExist },
    { originalErrorCode: IModelsErrorCode.IModelExists, expectedErrorNumber: IModelHubStatus.iModelAlreadyExists },
    { originalErrorCode: IModelsErrorCode.VersionExists, expectedErrorNumber: IModelHubStatus.VersionAlreadyExists },
    { originalErrorCode: IModelsErrorCode.ChangesetExists, expectedErrorNumber: IModelHubStatus.ChangeSetAlreadyExists },
    { originalErrorCode: IModelsErrorCode.NamedVersionOnChangesetExists, expectedErrorNumber: IModelHubStatus.ChangeSetAlreadyHasVersion },
    { originalErrorCode: IModelsErrorCode.NewerChangesExist, expectedErrorNumber: IModelHubStatus.PullIsRequired },
    { originalErrorCode: IModelsErrorCode.BaselineFileInitializationTimedOut, expectedErrorNumber: IModelHubStatus.InitializationTimeout },
    { originalErrorCode: IModelsErrorCode.IModelFromTemplateInitializationTimedOut, expectedErrorNumber: IModelHubStatus.InitializationTimeout },
    { originalErrorCode: IModelsErrorCode.ClonedIModelInitializationTimedOut, expectedErrorNumber: IModelHubStatus.InitializationTimeout }
  ].forEach((testCase: { originalErrorCode: IModelsErrorCode, expectedErrorNumber: number }) => {

    it(`should return correct error number (${testCase.originalErrorCode})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IModelsErrorImpl({ code: testCase.originalErrorCode, message: originalErrorMessage, originalError: new Error(), statusCode: 400, details: undefined });

      const result = ErrorAdapter.toIModelError(originalError, undefined);

      const isiModelError = result instanceof IModelError;
      expect(isiModelError).to.be.true;
      const iModelError = result as IModelError;
      expect(iModelError.errorNumber).to.be.equal(testCase.expectedErrorNumber);
      expect(iModelError.message).to.be.equal(originalErrorMessage);
    });
  });

  [
    {
      originalErrorCode: IModelsErrorCode.RateLimitExceeded,
      operationName: "acquireBriefcase" as const,
      expectedErrorNumber: IModelHubStatus.MaximumNumberOfBriefcasesPerUserPerMinute
    },
    {
      originalErrorCode: IModelsErrorCode.DownloadAborted,
      operationName: "downloadChangesets" as const,
      expectedErrorNumber: ChangeSetStatus.DownloadCancelled
    },
    {
      originalErrorCode: IModelsErrorCode.ConflictWithAnotherUser,
      operationName: "createChangeset" as const,
      expectedErrorNumber: IModelHubStatus.AnotherUserPushing
    },
    {
      originalErrorCode: IModelsErrorCode.ConflictWithAnotherUser,
      operationName: "updateLocks" as const,
      expectedErrorNumber: IModelHubStatus.LockOwnedByAnotherBriefcase
    }
  ].forEach((testCase: { originalErrorCode: IModelsErrorCode, operationName: OperationNameForErrorMapping, expectedErrorNumber: number }) => {

    it(`should handle generic error codes for specific operation (${testCase.originalErrorCode}, ${testCase.operationName})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IModelsErrorImpl({ code: testCase.originalErrorCode, message: originalErrorMessage, originalError: new Error(), statusCode: undefined, details: undefined });

      const result = ErrorAdapter.toIModelError(originalError, testCase.operationName);

      const isiModelError = result instanceof IModelError;
      expect(isiModelError).to.be.true;
      const iModelError = result as IModelError;
      expect(iModelError.errorNumber).to.be.equal(testCase.expectedErrorNumber);
      expect(iModelError.message).to.be.equal(originalErrorMessage);
    });
  });

  [
    {
      originalErrorCode: "foo" as IModelsErrorCode,
      operationName: undefined
    },
    {
      originalErrorCode: IModelsErrorCode.ResourceQuotaExceeded,
      operationName: "downloadChangesets" as const
    },
    {
      originalErrorCode: IModelsErrorCode.RateLimitExceeded,
      operationName: undefined
    },
    {
      originalErrorCode: IModelsErrorCode.DownloadAborted,
      operationName: "acquireBriefcase" as const
    },
    {
      originalErrorCode: IModelsErrorCode.ConflictWithAnotherUser,
      operationName: "acquireBriefcase" as const
    }
  ].forEach((testCase: { originalErrorCode: IModelsErrorCode, operationName: OperationNameForErrorMapping | undefined }) => {

    it(`should return IModelHubStatus.Unknown specific status could not be determined (${testCase.originalErrorCode})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IModelsErrorImpl({ code: testCase.originalErrorCode, message: originalErrorMessage, statusCode: undefined, originalError: new Error(), details: undefined });

      const result = ErrorAdapter.toIModelError(originalError, testCase.operationName);

      const isiModelError = result instanceof IModelError;
      expect(isiModelError).to.be.true;
      const iModelError = result as IModelError;
      expect(iModelError.errorNumber).to.be.equal(IModelHubStatus.Unknown);
      expect(iModelError.message).to.be.equal(originalErrorMessage);
    });
  });

  it("should correctly parse MaximumNumberOfBriefcasesPerUser error", () => {
    const apiResponse = {
      error: {
        code: "InvalidiModelsRequest",
        message: "Cannot acquire Briefcase.",
        details: [
          {
            code: "foo",
            message: "bar"
          },
          {
            code: "foo",
            message: "bar",
            innerError: {}
          },
          {
            code: "ResourceQuotaExceeded",
            message: "Maximum number of Briefcases per user limit reached.",
            innerError: {
              code: "MaximumNumberOfBriefcasesPerUser"
            }
          }
        ]
      }
    };
    const apiError = IModelsErrorParser.parse({ statusCode: 422, body: apiResponse }, new Error());

    const result = ErrorAdapter.toIModelError(apiError);

    const isiModelError = result instanceof IModelError;
    expect(isiModelError).to.be.true;
    const iModelError = result as IModelError;
    expect(iModelError.errorNumber).to.be.equal(IModelHubStatus.MaximumNumberOfBriefcasesPerUser);
    expect(iModelError.message).to.be.equal(
      "Cannot acquire Briefcase. Details:\n" +
      "1. Unrecognized: bar\n" +
      "2. Unrecognized: bar\n" +
      "3. ResourceQuotaExceeded: Maximum number of Briefcases per user limit reached.\n");
  });

  it("should correctly parse MaximumNumberOfBriefcasesPerUserPerMinute error", () => {
    const apiResponse = {
      error: {
        code: "RateLimitExceeded",
        message: "Maximum number of briefcases per user per minute reached."
      }
    };
    const apiError = IModelsErrorParser.parse({ statusCode: 429, body: apiResponse }, new Error());

    const result = ErrorAdapter.toIModelError(apiError, "acquireBriefcase");

    const isiModelError = result instanceof IModelError;
    expect(isiModelError).to.be.true;
    const iModelError = result as IModelError;
    expect(iModelError.errorNumber).to.be.equal(IModelHubStatus.MaximumNumberOfBriefcasesPerUserPerMinute);
    expect(iModelError.message).to.be.equal("Maximum number of briefcases per user per minute reached.");
  });
});
