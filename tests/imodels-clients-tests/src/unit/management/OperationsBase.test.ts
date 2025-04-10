/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { Authorization, AxiosRestClient, ContentType } from "@itwin/imodels-client-management";

import { createStub } from "../Stubs.js";

import { TestOperationsWrapper } from "./TestOperationsWrapper.js";

describe("[Management] OperationsBase", () => {
  let restClient: sinon.SinonStubbedInstance<AxiosRestClient>;
  let requiredArgs: {url: string, authorization: () => Promise<Authorization>};

  const operationsTestCases: {
    caseName: string;
    headersPassedToConstructor: Record<string, string | (() => string | undefined)>;
    headersPassedToOperation: Record<string, string | (() => string | undefined)>;
    expectedHeaders: Record<string, string>;
  }[] = [
    {
      caseName: "Adds constructor headers",
      headersPassedToConstructor: {
        "header-specified-in-constructor": "constructor"
      },
      headersPassedToOperation: {},
      expectedHeaders: {
        "header-specified-in-constructor": "constructor"
      }
    },
    {
      caseName: "Adds operation headers",
      headersPassedToConstructor: {},
      headersPassedToOperation: {
        "header-specified-in-operation": "operation"
      },
      expectedHeaders: {
        "header-specified-in-operation": "operation"
      }
    },
    {
      caseName: "Adds constructor and operation headers",
      headersPassedToConstructor: {
        "header-specified-in-constructor": "constructor"
      },
      headersPassedToOperation: {
        "header-specified-in-operation": "operation"
      },
      expectedHeaders: {
        "header-specified-in-constructor": "constructor",
        "header-specified-in-operation": "operation"
      }
    },
    {
      caseName: "Replaces constructor headers",
      headersPassedToConstructor: {
        "header-specified-in-constructor": "constructor"
      },
      headersPassedToOperation: {
        "header-specified-in-constructor": "operation"
      },
      expectedHeaders: {
        "header-specified-in-constructor": "operation"
      }
    },
    {
      caseName: "Removes constructor headers",
      headersPassedToConstructor: {
        "header-specified-in-constructor": "constructor"
      },
      headersPassedToOperation: {
        "header-specified-in-constructor": () => undefined
      },
      expectedHeaders: {}
    },
    {
      caseName: "Works with function headers",
      headersPassedToConstructor: {
        "header-specified-in-constructor": () => "constructor"
      },
      headersPassedToOperation: {
        "header-specified-in-operation": () => "operation"
      },
      expectedHeaders: {
        "header-specified-in-constructor": "constructor",
        "header-specified-in-operation": "operation"
      }
    }
  ];

  before( async () => {
    restClient = createStub(AxiosRestClient);
    const authorizationCallback = async () => {
      const authorization: Authorization = {
        scheme: "scheme",
        token: "token"
      };
      return Promise.resolve(authorization);
    };
    requiredArgs = {url: "url", authorization: authorizationCallback};
  });

  for( const testCase of operationsTestCases) {
    const { caseName, headersPassedToConstructor, headersPassedToOperation, expectedHeaders } = testCase;

    it(`${caseName} works with Get Request`, async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: headersPassedToConstructor
        });

      // Act
      await iModelsOperationsWrapper.sendGetRequest({
        ...requiredArgs,
        headers: headersPassedToOperation
      });

      // Assert
      const callHeaders = restClient.sendGetRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include(expectedHeaders);
    });

    it(`${caseName} works with Post Request`, async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: headersPassedToConstructor
        });

      // Act
      await iModelsOperationsWrapper.sendPostRequest({
        ...requiredArgs,
        headers: headersPassedToOperation,
        body: {}
      });

      // Assert
      const callHeaders = restClient.sendPostRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include(expectedHeaders);
    });

    it(`${caseName} works with Put Request`, async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: headersPassedToConstructor
        });

      // Act
      await iModelsOperationsWrapper.sendPutRequest({
        ...requiredArgs,
        headers: headersPassedToOperation,
        body: new Uint8Array(),
        contentType: ContentType.Png
      });

      // Assert
      const callHeaders = restClient.sendPutRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include(expectedHeaders);
    });

    it(`${caseName} works with Delete Request`, async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: headersPassedToConstructor
        });

      // Act
      await iModelsOperationsWrapper.sendDeleteRequest({
        ...requiredArgs,
        headers: headersPassedToOperation
      });

      // Assert
      const callHeaders = restClient.sendDeleteRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include(expectedHeaders);
    });

    it(`${caseName} works with Patch Request`, async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: headersPassedToConstructor
        });

      // Act
      await iModelsOperationsWrapper.sendPatchRequest({
        ...requiredArgs,
        headers: headersPassedToOperation,
        body: {}
      });

      // Assert
      const callHeaders = restClient.sendPatchRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include(expectedHeaders);
    });
  }
});
