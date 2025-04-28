/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosError } from "axios";
import MockAdapter from "axios-mock-adapter";
import { expect } from "chai";
import sinon from "sinon";

import {
  AxiosRestClient, AxiosRetryPolicy, ContentType, HttpRequestWithJsonBodyParams, UtilityFunctions
} from "@itwin/imodels-client-management";

import { createStub } from "../Stubs";

describe("[Management] AxiosRestClient", () => {
  let axiosMock: MockAdapter;
  let retryPolicyStub: sinon.SinonStubbedInstance<AxiosRetryPolicy>;
  let sleepStub: sinon.SinonStub;

  before(() => {
    axiosMock = new MockAdapter(axios);
    retryPolicyStub = createStub(AxiosRetryPolicy);
    sleepStub = sinon.stub(UtilityFunctions, "sleep");
  });

  afterEach(() => {
    axiosMock.reset();
    sleepStub.resetHistory();
    retryPolicyStub.getSleepDurationInMs.reset();
    retryPolicyStub.shouldRetry.reset();
    (retryPolicyStub as any).maxRetries = 3;
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
    const restClient = new AxiosRestClient(null);

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
    const restClient = new AxiosRestClient(null);

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
    const restClient = new AxiosRestClient(null);

    // Act
    const response = await restClient.sendPostRequest(requestParams);
    const actualHeaders = response.headers.getAll();

    // Assert
    expect(Object.assign({}, actualHeaders)).to.deep.equal(expectedHeaders);
  });

  it("should not retry on error if retry policy is null", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosMock.onPost(requestParams.url).reply(500);
    const restClient = new AxiosRestClient(null);

    // Act
    let thrownError;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as AxiosError).status).to.be.equal(500);
    expect(axiosMock.history.post.length === 1);
  });

  it("should not retry on error if retry policy is null", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosMock.onPost(requestParams.url).reply(500);
    const restClient = new AxiosRestClient(null);

    // Act
    let thrownError;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as AxiosError).status).to.be.equal(500);
    expect(axiosMock.history.post.filter((x) => x.url === requestParams.url).length === 1);
  });

  it("should hard cap retries at 10", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosMock.onPost(requestParams.url).reply(500);
    (retryPolicyStub as any).maxRetries = undefined;
    const restClient = new AxiosRestClient(retryPolicyStub);

    // Act
    let thrownError;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as AxiosError).status).to.be.equal(500);
    expect(axiosMock.history.post.filter((x) => x.url === requestParams.url).length === 11);
  });

  it("should not retry request on error according to retry policy", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosMock.onPost(requestParams.url).reply(500),
    retryPolicyStub.shouldRetry.returns(false);
    const restClient = new AxiosRestClient(retryPolicyStub);

    // Act
    let thrownError: unknown;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as AxiosError).status).to.be.equal(500);
    expect(axiosMock.history.post.filter((x) => x.url === requestParams.url).length).to.be.equal(1);
    expect(retryPolicyStub.shouldRetry.calledOnceWith({ retriesInvoked: 0, error: sinon.match.any })).to.be.true;
    expect(retryPolicyStub.getSleepDurationInMs.callCount).to.be.equal(0);
    expect(sleepStub.callCount).to.be.equal(0);
  });

  it("should fail on 1st request and succeed on 2nd", async () => {
    // Arrange
    const responseData = { name: "some name" };
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosMock
      .onPost(requestParams.url)
      .replyOnce(500)
      .onPost(requestParams.url)
      .replyOnce(200, responseData),
    retryPolicyStub.shouldRetry.returns(true);
    retryPolicyStub.getSleepDurationInMs.returns(1000);
    const restClient = new AxiosRestClient(retryPolicyStub);

    // Act
    const response = await restClient.sendPostRequest(requestParams);

    // Assert
    expect(response.body).to.deep.equal(responseData);
    expect(axiosMock.history.post.filter((x) => x.url === requestParams.url).length).to.be.equal(2);
    expect(retryPolicyStub.shouldRetry.calledOnceWith({ retriesInvoked: 0, error: sinon.match.any })).to.be.true;
    expect(retryPolicyStub.getSleepDurationInMs.calledOnceWith({ retriesInvoked: 0 })).to.be.true;
    expect(sleepStub.calledOnceWith(1000)).to.be.true;
  });

  it("does not call sleep before retry if sleep duration is 0", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosMock.onPost(requestParams.url).reply(503);
    retryPolicyStub.shouldRetry.returns(true);
    retryPolicyStub.getSleepDurationInMs.returns(0);
    const restClient = new AxiosRestClient(retryPolicyStub);

    // Act
    let thrownError: unknown;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as AxiosError).status).to.be.equal(503);
    expect(axiosMock.history.post.filter((x) => x.url === requestParams.url).length).to.be.equal(4);

    expect(retryPolicyStub.shouldRetry.callCount).to.be.equal(3);
    expect(retryPolicyStub.shouldRetry.calledWithMatch({ retriesInvoked: 0, error: sinon.match.object })).to.be.true;
    expect(retryPolicyStub.shouldRetry.calledWithMatch({ retriesInvoked: 1, error: sinon.match.object })).to.be.true;
    expect(retryPolicyStub.shouldRetry.calledWithMatch({ retriesInvoked: 2, error: sinon.match.object })).to.be.true;

    expect(retryPolicyStub.getSleepDurationInMs.callCount).to.be.equal(3);
    expect(retryPolicyStub.getSleepDurationInMs.args[0][0]).to.deep.equal({ retriesInvoked: 0 });
    expect(retryPolicyStub.getSleepDurationInMs.args[1][0]).to.deep.equal({ retriesInvoked: 1 });
    expect(retryPolicyStub.getSleepDurationInMs.args[2][0]).to.deep.equal({ retriesInvoked: 2 });

    expect(sleepStub.callCount).to.be.equal(0);
  });
});
