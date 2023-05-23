/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AxiosRestClient } from "@itwin/imodels-client-management/lib/base/internal";
import { expect } from "chai";

import { Authorization, ContentType } from "@itwin/imodels-client-management";

import { createStub } from "../Stubs";

import { TestOperationsWrapper } from "./TestOperationsWrapper";

describe("[Management] IModelsOperationsHeaders", () => {
  const restClient = createStub(AxiosRestClient);
  const constructorHeaders = { "x-correlation-id": "constructor" };
  const iModelsOperationsWrapper = new TestOperationsWrapper(
    {
      restClient,
      api: {version: "version"},
      headers: constructorHeaders
    });
  const authorizationCallback = async () => {
    const authorization: Authorization = {
      scheme: "scheme",
      token: "token"
    };
    return Promise.resolve(authorization);
  };
  const requiredArgs = {url: "url", authorization: authorizationCallback};

  it("should add constructor headers", async () => {
    // Act
    await iModelsOperationsWrapper.sendDeleteRequest({
      authorization: authorizationCallback,
      url: "url"
    });

    // Assert
    const callHeaders = restClient.sendDeleteRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
  });

  it("should add operation headers", async () => {
    // Arrange
    const operationHeaders = { "custom-header": "operation" };

    // Act
    await iModelsOperationsWrapper.sendDeleteRequest({
      ...requiredArgs,
      headers: operationHeaders
    });

    // Assert
    const callHeaders = restClient.sendDeleteRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
    expect(callHeaders["custom-header"]).to.equal("operation");
  });

  it("should replace constructor headers", async () => {
    // Arrange
    const operationHeaders = { "x-correlation-id": "operation" };

    // Act
    await iModelsOperationsWrapper.sendDeleteRequest({
      ...requiredArgs,
      headers: operationHeaders
    });

    // Assert
    const callHeaders = restClient.sendDeleteRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("operation");
  });

  it("sendGetRequest should add headers", async () => {
    // Arrange
    const operationHeaders = { "custom-header": "operation" };

    // Act
    await iModelsOperationsWrapper.sendGetRequest({
      ...requiredArgs,
      headers: operationHeaders
    });

    // Assert
    const callHeaders = restClient.sendGetRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
    expect(callHeaders["custom-header"]).to.equal("operation");
  });

  it("sendPostRequest should add headers", async () => {
    // Arrange
    const operationHeaders = { "custom-header": "operation" };

    // Act
    await iModelsOperationsWrapper.sendPostRequest({
      ...requiredArgs,
      headers: operationHeaders,
      body: {}
    });

    // Assert
    const callHeaders = restClient.sendPostRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
    expect(callHeaders["custom-header"]).to.equal("operation");
  });

  it("sendPutRequest should add headers", async () => {
    // Arrange
    const operationHeaders = { "custom-header": "operation" };

    // Act
    await iModelsOperationsWrapper.sendPutRequest({
      ...requiredArgs,
      headers: operationHeaders,
      contentType: ContentType.Png,
      body: new Uint8Array(0)
    });

    // Assert
    const callHeaders = restClient.sendPutRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
    expect(callHeaders["custom-header"]).to.equal("operation");
  });

  it("sendPatchRequest should add headers", async () => {
    // Arrange
    const operationHeaders = { "custom-header": "operation" };

    // Act
    await iModelsOperationsWrapper.sendPatchRequest({
      ...requiredArgs,
      headers: operationHeaders,
      body: {}
    });

    // Assert
    const callHeaders = restClient.sendPatchRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
    expect(callHeaders["custom-header"]).to.equal("operation");
  });

  it("sendDeleteRequest should add headers", async () => {
    // Arrange
    const operationHeaders = { "custom-header": "operation" };

    // Act
    await iModelsOperationsWrapper.sendDeleteRequest({
      ...requiredArgs,
      headers: operationHeaders
    });

    // Assert
    const callHeaders = restClient.sendDeleteRequest.lastCall.args[0].headers;
    expect(callHeaders["x-correlation-id"]).to.equal("constructor");
    expect(callHeaders["custom-header"]).to.equal("operation");
  });
});
