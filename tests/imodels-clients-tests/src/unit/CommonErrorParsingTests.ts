/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  IModelsError,
  IModelsErrorCode,
  IModelsOriginalError,
  ResponseInfo,
} from "@itwin/imodels-client-management";
import { assertError } from "@itwin/imodels-client-test-utils";

export function testIModelsErrorParser(
  testedFunction: (
    response: ResponseInfo,
    originalError: IModelsOriginalError
  ) => Error
): void {
  it("should parse valid iModels API error", () => {
    // Arrange
    const errorResponse: unknown = {
      error: {
        code: "InvalidiModelsRequest",
        message: "Cannot create iModel.",
        details: [
          {
            code: "InvalidValue",
            message:
              "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent",
          },
          {
            code: "MissingRequiredProperty",
            message: "Required property is missing.",
            target: "name",
          },
          {
            code: "InvalidRequestBody",
            message:
              "Failed to parse request body. Make sure it is a valid JSON.",
          },
        ],
      },
    };

    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 422, body: errorResponse },
      new Error()
    ) as IModelsError;

    // Assert
    const expectedErrorMessage =
      "Cannot create iModel. Details:\n" +
      "1. InvalidValue: Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90. Target: extent.\n" +
      "2. MissingRequiredProperty: Required property is missing. Target: name.\n" +
      "3. InvalidRequestBody: Failed to parse request body. Make sure it is a valid JSON.\n";
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.InvalidIModelsRequest,
        statusCode: 422,
        message: expectedErrorMessage,
        details: [
          {
            code: IModelsErrorCode.InvalidValue,
            message:
              "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent",
          },
          {
            code: IModelsErrorCode.MissingRequiredProperty,
            message: "Required property is missing.",
            target: "name",
          },
          {
            code: IModelsErrorCode.InvalidRequestBody,
            message:
              "Failed to parse request body. Make sure it is a valid JSON.",
          },
        ],
      },
    });
  });

  it("should parse unauthorized error when error is of regular iModels API error format", () => {
    // Arrange
    const errorResponse: unknown = {
      error: {
        code: "iModels API code",
        message: "iModels API message",
      },
    };

    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 401, body: errorResponse },
      new Error()
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        statusCode: 422,
        message: "iModels API message",
      },
    });
  });

  it("should parse unauthorized error when error is of unwrapped error format", () => {
    // Arrange
    const errorResponse: unknown = {
      code: "unwrapped error code",
      message: "unwrapped error message",
    };

    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 401, body: errorResponse },
      new Error()
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        statusCode: 401,
        message: "unwrapped error message",
      },
    });
  });

  it("should parse unauthorized error when error is of unknown format", () => {
    // Arrange
    const errorResponse: unknown = {};

    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 401, body: errorResponse },
      new Error()
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        statusCode: 401,
        message: "Authorization failed",
      },
    });
  });

  it("should return unknown error when error properties and response properties are undefined", () => {
    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: undefined, body: undefined },
      new Error()
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message:
          "Unknown error occurred.\n" +
          "Original error message: ,\n" +
          "original error code: undefined,\n" +
          "response status code: undefined,\n" +
          "response body: undefined",
      },
    });
  });

  it("should include original error code in unrecognized error message", () => {
    // Act
    const originalError = new Error("originalErrorMessage");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (originalError as any).code = "originalErrorCode";
    const parsedError: IModelsError = testedFunction(
      { statusCode: undefined, body: undefined },
      originalError
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: originalErrorCode,\n" +
          "response status code: undefined,\n" +
          "response body: undefined",
      },
    });
  });

  it("should return unknown error when error body is not defined", () => {
    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 444, body: undefined },
      new Error("originalErrorMessage")
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        statusCode: 444,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: undefined,\n" +
          "response status code: 444,\n" +
          "response body: undefined",
      },
    });
  });

  it("should return unknown error when error body is null", () => {
    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 445, body: null },
      new Error("originalErrorMessage")
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        statusCode: 445,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: undefined,\n" +
          "response status code: 445,\n" +
          "response body: null",
      },
    });
  });

  it("should return unknown error when error body is of unexpected format", () => {
    // Act
    const parsedError: IModelsError = testedFunction(
      { statusCode: 446, body: { unknownProperty: "unknown value" } },
      new Error("originalErrorMessage")
    ) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        statusCode: 446,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: undefined,\n" +
          "response status code: 446,\n" +
          'response body: {"unknownProperty":"unknown value"}',
      },
    });
  });
}
