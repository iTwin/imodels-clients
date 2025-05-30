/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  IModelsClient,
  IModelsErrorCode,
} from "@itwin/imodels-client-management";
import { assertError } from "@itwin/imodels-client-test-utils";

describe("[Management] IModelsClient", () => {
  it("should return original error information in case of network issue", async () => {
    // Arrange
    const iModelsClient = new IModelsClient({
      api: { baseUrl: "http://foo.bar" },
    });

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.iModels.getSingle({
        authorization: async () => Promise.resolve({ scheme: "", token: "" }),
        iModelId: "foo",
      });
    } catch (error: unknown) {
      objectThrown = error;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.Unrecognized,
        message:
          "Unknown error occurred.\n" +
          "Original error message: getaddrinfo ENOTFOUND foo.bar,\n" +
          "original error code: ENOTFOUND,\n" +
          "response status code: undefined,\n" +
          "response body: undefined",
        originalError: {
          code: "ENOTFOUND",
          name: "Error",
          message: "getaddrinfo ENOTFOUND foo.bar",
        },
      },
    });
  });
});
