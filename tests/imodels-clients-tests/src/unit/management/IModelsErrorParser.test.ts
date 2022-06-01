/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsErrorParser } from "@itwin/imodels-client-management/lib/base/internal";

import { IModelsError, IModelsErrorCode } from "@itwin/imodels-client-management";
import { assertError } from "@itwin/imodels-client-test-utils";

describe("IModelsErrorParser", () => {
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
          },
          {
            code: "InvalidRequestBody",
            message: "Failed to parse request body. Make sure it is a valid JSON."
          }
        ]
      }
    };

    // Act
    const parsedError: IModelsError = IModelsErrorParser.parse({ statusCode: 400, body: errorResponse }) as IModelsError;

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
});
