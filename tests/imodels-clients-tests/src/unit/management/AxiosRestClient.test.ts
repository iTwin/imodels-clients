/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, IModelsErrorParser } from "@itwin/imodels-client-management/lib/base/internal";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { expect } from "chai";

import { ContentType, HttpRequestWithJsonBodyParams } from "@itwin/imodels-client-management";

describe("[Management] AxiosRestClient", () => {
  let axiosMock: MockAdapter;

  before(() => {
    axiosMock = new MockAdapter(axios);
  });

  it("should get response body", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };
    const responseBody = {
      iModelId: "IMODEL_ID",
      changesetId: 4,
      _links: {
        self: "https://imodelhub.bentley.com/something"
      }
    };
    axiosMock.onPost(requestParams.url).reply(200, responseBody, {});
    const restClient = new AxiosRestClient(IModelsErrorParser.parse);

    // Act
    const response = await restClient.sendPostRequest(requestParams);

    // Assert
    expect(response.body).to.deep.equal(responseBody);
  });

  it("should get response header value by case-insensitive name", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };
    const responseHeaders = {
      "location": "https://some-url.com",
      "retry-after": 60
    };
    axiosMock.onPost(requestParams.url).reply(200, {}, responseHeaders);
    const restClient = new AxiosRestClient(IModelsErrorParser.parse);

    // Act & Assert
    const response = await restClient.sendPostRequest(requestParams);

    expect(response.headers.get("location")).to.equal("https://some-url.com");
    expect(response.headers.get("Location")).to.equal("https://some-url.com");
    expect(response.headers.get("LOCATION")).to.equal("https://some-url.com");
    expect(response.headers.get("Retry-After")).to.equal("60");
    expect(response.headers.get("non-existent-header")).to.not.exist;
  });

  it("should get all response headers", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };
    const responseHeaders = {
      "location": "https://some-url.com",
      "retry-after": 60,
      "Content-Type": "application/json"
    };
    const expectedHeaders = {
      "location": "https://some-url.com",
      "retry-after": "60",
      "Content-Type": "application/json"
    };
    axiosMock.onPost(requestParams.url).reply(200, {}, responseHeaders);
    const restClient = new AxiosRestClient(IModelsErrorParser.parse);

    // Act
    const response = await restClient.sendPostRequest(requestParams);
    const actualHeaders = response.headers.getAll();

    // Assert
    expect(Object.assign({}, actualHeaders)).to.deep.equal(expectedHeaders);
  });
});
