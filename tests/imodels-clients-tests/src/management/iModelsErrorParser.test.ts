/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsError, iModelsErrorCode, iModelsErrorParser } from "@itwin/imodels-client-management";
import { assertError } from "../common";

describe("iModelsErrorParser", () => {
  it("should parse error", () => {
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
          }
        ]
      }
    };

    // Act
    const parsedError: iModelsError = iModelsErrorParser.parse({ statusCode: 400, body: errorResponse }) as iModelsError;

    // Assert
    const extectedErrorMessage = "Cannot create iModel. Details:\n" +
      "1. InvalidValue: Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90. Target: extent.\n" +
      "2. MissingRequiredProperty: Required property is missing. Target: name.\n";
    assertError({
      actualError: parsedError,
      expectedError: {
        code: iModelsErrorCode.InvalidiModelsRequest,
        message: extectedErrorMessage,
        details: [
          {
            code: iModelsErrorCode.InvalidValue,
            message: "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent"
          },
          {
            code: iModelsErrorCode.MissingRequiredProperty,
            message: "Required property is missing.",
            target: "name"
          }
        ]
      }
    });
  });
});
