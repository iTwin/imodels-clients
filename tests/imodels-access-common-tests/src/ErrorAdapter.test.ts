/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ITwinError } from "@itwin/core-bentley";
import { ErrorAdapter, OperationNameForErrorMapping } from "@itwin/imodels-access-common";
import { IModelsErrorParser as AuthoringIModelsErrorParser } from "@itwin/imodels-client-authoring";
import { IModelsErrorCode, IModelsErrorImpl, IModelsErrorParser, IModelsErrorScope } from "@itwin/imodels-client-management";
import { expect } from "chai";

describe("ErrorAdapter", () => {
  [
    { foo: "bar" },
    new IModelsErrorImpl({ code: 5 as any, message: "", originalError: undefined, statusCode: undefined, details: undefined })
  ].forEach((originalError: unknown) => {

    it("should return original error if it does not have a string error code", () => {
      const result = ErrorAdapter.toITwinError(originalError, undefined);

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

      const result = ErrorAdapter.toITwinError(error, undefined);

      expect(result).to.be.equal(error);
    });
  });

  [
    IModelsErrorCode.Unknown,
    IModelsErrorCode.ITwinNotFound,
    IModelsErrorCode.IModelNotFound,
    IModelsErrorCode.ChangesetNotFound,
    IModelsErrorCode.BriefcaseNotFound,
    IModelsErrorCode.FileNotFound,
    IModelsErrorCode.CheckpointNotFound,
    IModelsErrorCode.LockNotFound,
    IModelsErrorCode.IModelExists,
    IModelsErrorCode.VersionExists,
    IModelsErrorCode.ChangesetExists,
    IModelsErrorCode.NamedVersionOnChangesetExists,
    IModelsErrorCode.NewerChangesExist,
    IModelsErrorCode.BaselineFileInitializationTimedOut,
    IModelsErrorCode.IModelFromTemplateInitializationTimedOut,
    IModelsErrorCode.ClonedIModelInitializationTimedOut
  ].forEach((originalErrorCode: IModelsErrorCode) => {

    it(`should return correct error code (${originalErrorCode})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IModelsErrorImpl({ code: originalErrorCode, message: originalErrorMessage, originalError: new Error(), statusCode: 400, details: undefined });

      const result = ErrorAdapter.toITwinError(originalError, undefined);

      const isiTwinError = ITwinError.isError(result, IModelsErrorScope, originalErrorCode);
      expect(isiTwinError).to.be.true;
      const iTwinError = result as ITwinError;
      expect(iTwinError.message).to.be.equal(originalErrorMessage);
    });
  });

  [
    {
      originalErrorCode: IModelsErrorCode.RateLimitExceeded,
      operationName: "acquireBriefcase" as const,
      expectedErrorCode: IModelsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute
    },
    {
      originalErrorCode: IModelsErrorCode.DownloadAborted,
      operationName: "downloadChangesets" as const,
      expectedErrorCode: IModelsErrorCode.DownloadCancelled
    },
    {
      originalErrorCode: IModelsErrorCode.ConflictWithAnotherUser,
      operationName: "createChangeset" as const,
      expectedErrorCode: IModelsErrorCode.AnotherUserPushing
    },
    {
      originalErrorCode: IModelsErrorCode.ConflictWithAnotherUser,
      operationName: "updateLocks" as const,
      expectedErrorCode: IModelsErrorCode.LockOwnedByAnotherBriefcase
    }
  ].forEach((testCase: { originalErrorCode: IModelsErrorCode, operationName: OperationNameForErrorMapping, expectedErrorCode: IModelsErrorCode }) => {

    it(`should handle generic error codes for specific operation (${testCase.originalErrorCode}, ${testCase.operationName})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IModelsErrorImpl({ code: testCase.originalErrorCode, message: originalErrorMessage, originalError: new Error(), statusCode: undefined, details: undefined });

      const result = ErrorAdapter.toITwinError(originalError, testCase.operationName);

      const isiTwinError = ITwinError.isError(result, IModelsErrorScope, testCase.expectedErrorCode);
      expect(isiTwinError).to.be.true;
      const iTwinError = result as ITwinError;
      expect(iTwinError.message).to.be.equal(originalErrorMessage);
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

    it(`should return IModelsErrorCode.Unknown specific status could not be determined (${testCase.originalErrorCode})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IModelsErrorImpl({ code: testCase.originalErrorCode, message: originalErrorMessage, statusCode: undefined, originalError: new Error(), details: undefined });

      const result = ErrorAdapter.toITwinError(originalError, testCase.operationName);

      const isiTwinError = ITwinError.isError(result, IModelsErrorScope, IModelsErrorCode.Unknown);
      expect(isiTwinError).to.be.true;
      const iTwinError = result as ITwinError;
      expect(iTwinError.message).to.be.equal(originalErrorMessage);
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

    const result = ErrorAdapter.toITwinError(apiError);

    const isiTwinError = ITwinError.isError(result, IModelsErrorScope, IModelsErrorCode.MaximumNumberOfBriefcasesPerUser);
    expect(isiTwinError).to.be.true;
    const iTwinError = result as ITwinError;
    expect(iTwinError.message).to.be.equal(
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

    const result = ErrorAdapter.toITwinError(apiError, "acquireBriefcase");

    const isiTwinError = ITwinError.isError(result, IModelsErrorScope, IModelsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute);
    expect(isiTwinError).to.be.true;
    const iTwinError = result as ITwinError;
    expect(iTwinError.message).to.be.equal("Maximum number of briefcases per user per minute reached.");
  });

  it("should retain conflicting locks error details", () => {
    const apiResponse = {
      error: {
        code: "ConflictWithAnotherUser",
        message: "Lock(s) is owned by another Briefcase.",
        conflictingLocks: [
          { objectId: "0x1", lockLevel: "exclusive", briefcaseIds: [ 1 ] },
          { objectId: "0x2", lockLevel: "exclusive", briefcaseIds: [ 1 ] }
        ]
      }
    };
    const apiError = AuthoringIModelsErrorParser.parse({ statusCode: 409, body: apiResponse }, new Error());

    const result = ErrorAdapter.toITwinError(apiError, "updateLocks");

    const isiTwinError = ITwinError.isError(result, IModelsErrorScope, IModelsErrorCode.LockOwnedByAnotherBriefcase);
    expect(isiTwinError).to.be.true;
    const iTwinError = result as any;
    const firstLock = apiResponse.error.conflictingLocks[0];
    const secondLock = apiResponse.error.conflictingLocks[1];
    expect(iTwinError.conflictingLocks[0]).to.be.equal(firstLock);
    expect(iTwinError.conflictingLocks[1]).to.be.equal(secondLock);
    expect(iTwinError.message).to.be.equal(
      "Lock(s) is owned by another Briefcase. Conflicting locks:\n" +
      `1. Object id: ${firstLock.objectId}, lock level: ${firstLock.lockLevel}, briefcase ids: ${firstLock.briefcaseIds[0]}\n` +
      `2. Object id: ${secondLock.objectId}, lock level: ${secondLock.lockLevel}, briefcase ids: ${secondLock.briefcaseIds[0]}\n`);
  });
});
