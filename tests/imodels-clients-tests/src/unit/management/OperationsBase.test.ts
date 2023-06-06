/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient } from "@itwin/imodels-client-management/lib/base/internal";
import { expect } from "chai";

import { Authorization, ContentType } from "@itwin/imodels-client-management";

import { createStub } from "../Stubs";

import { TestOperationsWrapper } from "./TestOperationsWrapper";

describe("[Management] OperationsBase", () => {
  let restClient: sinon.SinonStubbedInstance<AxiosRestClient>;
  let requiredArgs: {url: string, authorization: () => Promise<Authorization>};

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

  describe("OperationsBase headers", () => {
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

  describe("OperationsBase Content-Type", () => {

    it("Adds Content-Type header for Post Request", async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: {}
        });

      // Act
      await iModelsOperationsWrapper.sendPostRequest({
        ...requiredArgs,
        body: {
          contentType: ContentType.Json,
          content: "serialized content"
        }
      });

      // Assert
      const callHeaders = restClient.sendPostRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include({"Content-Type": ContentType.Json});
    });

    it("Does not add Content-Type header for Post Request", async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: {}
        });

      // Act
      await iModelsOperationsWrapper.sendPostRequest({
        ...requiredArgs,
        body: {}
      });

      // Assert
      const callHeaders = restClient.sendPostRequest.lastCall.args[0].headers;
      expect(callHeaders).to.not.have.property("Content-Type");
    });

    it("Adds Content-Type header for Put Request", async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: {}
        });

      // Act
      await iModelsOperationsWrapper.sendPutRequest({
        ...requiredArgs,
        body: new Uint8Array(1),
        contentType: ContentType.Png
      });

      // Assert
      const callHeaders = restClient.sendPutRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include({"Content-Type": ContentType.Png});
    });

    it("Does not add Content-Type header for Put Request", async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: {}
        });

      // Act
      await iModelsOperationsWrapper.sendPutRequest({
        ...requiredArgs,
        body: new Uint8Array(),
        contentType: ContentType.Png
      });

      // Assert
      const callHeaders = restClient.sendPutRequest.lastCall.args[0].headers;
      expect(callHeaders).to.not.have.property("Content-Type");
    });

    it("Adds Content-Type header for Patch Request", async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: {}
        });

      // Act
      await iModelsOperationsWrapper.sendPatchRequest({
        ...requiredArgs,
        body: {
          contentType: ContentType.Json,
          content: "serialized content"
        }
      });

      // Assert
      const callHeaders = restClient.sendPatchRequest.lastCall.args[0].headers;
      expect(callHeaders).to.include({"Content-Type": ContentType.Json});
    });

    it("Does not add Content-Type header for Patch Request", async () => {
      // Arrange
      const iModelsOperationsWrapper = new TestOperationsWrapper(
        {
          restClient,
          api: {version: "version"},
          headers: {}
        });

      // Act
      await iModelsOperationsWrapper.sendPatchRequest({
        ...requiredArgs,
        body: {}
      });

      // Assert
      const callHeaders = restClient.sendPatchRequest.lastCall.args[0].headers;
      expect(callHeaders).to.not.have.property("Content-Type");
    });
  });
});
