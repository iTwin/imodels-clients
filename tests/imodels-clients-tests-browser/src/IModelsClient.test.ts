/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelsErrorCode } from "@itwin/imodels-client-management";
import { IModelsClient } from "@itwin/imodels-client-management";
import { assertError } from "@itwin/imodels-client-test-utils";

describe(`[Management] ${IModelsClient.name}`, () => {
  it("should return original error information in case of network issue", function (done) {
    // Arrange
    const iModelsClient = new IModelsClient({
      api: { baseUrl: "http://foo.bar" }
    });

    // Act
    iModelsClient.iModels.getSingle({
      authorization: async () => ({ scheme: "", token: "" }),
      iModelId: "foo"
    }).catch((err) => {

      // Assert
      assertError({
        objectThrown: err,
        expectedError: {
          code: IModelsErrorCode.Unrecognized,
          message: "Unknown error occurred.\n"
            + "Original error message: getaddrinfo ENOTFOUND foo.bar,\n"
            + "original error code: ENOTFOUND,\n"
            + "response status code: undefined,\n"
            + "response body: undefined",
          originalError: {
            code: "ENOTFOUND",
            name: "Error",
            message: "getaddrinfo ENOTFOUND foo.bar"
          }
        }
      });

      done();
    });
  });
});
