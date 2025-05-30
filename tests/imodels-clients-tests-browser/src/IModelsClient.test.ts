/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  IModelsClient,
  IModelsErrorCode,
} from "@itwin/imodels-client-management";
import { assertError } from "@itwin/imodels-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

describe(`[Management] ${IModelsClient.name}`, () => {
  it("should return original error information in case of network issue", function (done) {
    // Arrange
    const iModelsClient = new IModelsClient({
      api: { baseUrl: "http://foo.bar" },
    });

    // Act
    iModelsClient.iModels
      .getSingle({
        authorization: () => Promise.resolve({ scheme: "", token: "" }),
        iModelId: "foo",
      })
      .catch((err) => {
        // Assert
        assertError({
          objectThrown: err,
          expectedError: {
            code: IModelsErrorCode.Unrecognized,
            message:
              "Unknown error occurred.\n" +
              "Original error message: Network Error,\n" +
              "original error code: ERR_NETWORK,\n" +
              "response status code: undefined,\n" +
              "response body: undefined",
            originalError: {
              code: "ERR_NETWORK",
              name: "Error",
              message: "Network Error",
            },
          },
        });

        done();
      });
  });
});
