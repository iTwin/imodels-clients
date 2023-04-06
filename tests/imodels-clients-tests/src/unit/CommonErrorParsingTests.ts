/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ResponseInfo } from "@itwin/imodels-client-management/lib/base/internal";

import { IModelsError, IModelsErrorCode } from "@itwin/imodels-client-management";
import { assertError } from "@itwin/imodels-client-test-utils";

export function testIModelsErrorParser(testedFunction: (response: ResponseInfo) => Error): void {
  it("should parse valid iModels API error", () => {
    // Arrange
    const errorResponse: unknown = {
      error: {
        code: "InvalidiModelsRequest",
        message: "Cannot create iModel.",
        details: [
          {
            code: "InvalidValue",
            message: "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent"
          },
          {
            code: "MissingRequiredProperty",
            message: "Required property is missing.",
            target: "name"
          },
          {
            code: "InvalidRequestBody",
            message: "Failed to parse request body. Make sure it is a valid JSON."
          }
        ]
      }
    };

    // Act
    const parsedError: IModelsError = testedFunction({ body: errorResponse }) as IModelsError;

    // Assert
    const expectedErrorMessage = "Cannot create iModel. Details:\n" +
      "1. InvalidValue: Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90. Target: extent.\n" +
      "2. MissingRequiredProperty: Required property is missing. Target: name.\n" +
      "3. InvalidRequestBody: Failed to parse request body. Make sure it is a valid JSON.\n";
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.InvalidIModelsRequest,
        message: expectedErrorMessage,
        details: [
          {
            code: IModelsErrorCode.InvalidValue,
            message: "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent"
          },
          {
            code: IModelsErrorCode.MissingRequiredProperty,
            message: "Required property is missing.",
            target: "name"
          },
          {
            code: IModelsErrorCode.InvalidRequestBody,
            message: "Failed to parse request body. Make sure it is a valid JSON."
          }
        ]
      }
    });
  });

  it("should parse unauthorized error when error is of regular iModels API error format", () => {
    // Arrange
    const errorResponse: unknown = {
      error: {
        code: "iModels API code",
        message: "iModels API message"
      }
    };

    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: 401, body: errorResponse }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        message: "iModels API message"
      }
    });
  });

  it("should parse unauthorized error when error is of unwrapped error format", () => {
    // Arrange
    const errorResponse: unknown = {
      code: "unwrapped error code",
      message: "unwrapped error message"
    };

    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: 401, body: errorResponse }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        message: "unwrapped error message"
      }
    });
  });

  it("should parse unauthorized error when error is of unknown format", () => {
    // Arrange
    const errorResponse: unknown = {};

    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: 401, body: errorResponse }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        message: "Authorization failed"
      }
    });
  });

  it("should return unknown error when error status code and body is not defined", () => {
    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: undefined, body: undefined }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message: "Unknown error occurred. Response status code: undefined, response body: undefined"
      }
    });
  });

  it("should return unknown error when error body is not defined", () => {
    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: 444, body: undefined }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message: "Unknown error occurred. Response status code: 444, response body: undefined"
      }
    });
  });

  it("should return unknown error when error body is null", () => {
    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: 445, body: null }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message: "Unknown error occurred. Response status code: 445, response body: null"
      }
    });
  });

  it("should return unknown error when error body is of unexpected format", () => {
    // Act
    const parsedError: IModelsError = testedFunction({ statusCode: 446, body: { unknownProperty: "unknown value" } }) as IModelsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message: "Unknown error occurred. Response status code: 446, response body: {\"unknownProperty\":\"unknown value\"}"
      }
    });
  });
}
