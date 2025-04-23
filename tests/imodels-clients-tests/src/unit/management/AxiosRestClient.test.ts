/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, AxiosRetryPolicy, IModelsApiError } from "@itwin/imodels-client-management";
import axios from "axios";
import { expect } from "chai";
import sinon from "sinon";
import { ContentType, HttpRequestWithJsonBodyParams } from "@itwin/imodels-client-management";

import { createStub } from "../Stubs.js";

describe("[Management] AxiosRestClient", async () => {
  let retryPolicyStub: sinon.SinonStubbedInstance<AxiosRetryPolicy>;
  // let sleepMock: sinon.SinonStub;
  let axiosStub: sinon.SinonStub;
  before(() => {
    retryPolicyStub = createStub(AxiosRetryPolicy);
    // sleepStub = sinon.stub(utilityFunctions, "sleep");
  });

  afterEach(() => {
    axiosStub.restore();
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
    axiosStub = sinon.stub(axios, "post").resolves({
      url: requestParams.url,
      data: responseBody,
      status: 200
    });

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
    axiosStub = sinon.stub(axios, "post").resolves({
      url: requestParams.url,
      headers: responseHeaders,
      status: 200
    });
    const restClient = new AxiosRestClient(null);

    // Act & Assert
    const response = await restClient.sendPostRequest(requestParams);

    expect(response.headers.get("location")).to.equal("https://some-url.com");
    expect(response.headers.get("Location")).to.equal("https://some-url.com");
    expect(response.headers.get("LOCATION")).to.equal("https://some-url.com");
    expect(response.headers.get("Retry-After")).to.equal(60);
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
      "retry-after": 60,
      "Content-Type": "application/json"
    };
    axiosStub = sinon.stub(axios, "post").resolves({
      url: requestParams.url,
      headers: responseHeaders,
      status: 200
    });
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

    axiosStub = sinon.stub(axios, "post").throws({
      url: requestParams.url,
      statusCode: 500
    });
    const restClient = new AxiosRestClient(null);

    // Act
    let thrownError;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as IModelsApiError).statusCode).to.be.equal(500);
    expect(axiosStub.calledOnce).to.be.true;
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

    axiosStub = sinon.stub(axios, "post").throws({
      url: requestParams.url,
      statusCode: 500
    });
    const restClient = new AxiosRestClient(null);

    // Act
    let thrownError;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as IModelsApiError).statusCode).to.be.equal(500);
    expect(axiosStub.calledOnceWith(requestParams.url));
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

    axiosStub = sinon.stub(axios, "post").throws({
      url: requestParams.url,
      statusCode: 500
    });
    (retryPolicyStub as any).maxRetries = undefined;
    retryPolicyStub.shouldRetry.returns(true);
    const restClient = new AxiosRestClient(retryPolicyStub);

    // Act
    let thrownError;
    try {
      await restClient.sendPostRequest(requestParams);
    } catch (error: unknown) {
      thrownError = error;
    }

    // Assert
    expect((thrownError as IModelsApiError).statusCode).to.be.equal(500);
    expect(axiosStub.getCalls().filter((call => call.args[0] === requestParams.url)).length).to.be.equal(11);
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

    axiosStub = sinon.stub(axios, "post").throws({
      url: requestParams.url,
      statusCode: 500
    });
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
    expect((thrownError as IModelsApiError).statusCode).to.be.equal(500);
    expect(axiosStub.calledOnceWith(requestParams.url));
    expect(retryPolicyStub.shouldRetry.calledOnceWith({ retriesInvoked: 0, error: sinon.match.any })).to.be.true;
    expect(retryPolicyStub.getSleepDurationInMs.callCount).to.be.equal(0);
    // expect(sleepMock.callCount).to.be.equal(0);
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

    axiosStub = sinon.stub(axios, "post").onFirstCall().throws({
      url: requestParams.url,
      statusCode: 500
    }).onSecondCall().resolves({
      url: requestParams.url,
      data: responseData
    });
    retryPolicyStub.shouldRetry.returns(true);
    retryPolicyStub.getSleepDurationInMs.returns(1000);
    const restClient = new AxiosRestClient(retryPolicyStub);

    // Act
    const response = await restClient.sendPostRequest(requestParams);

    // Assert
    expect(response.body).to.deep.equal(responseData);
    expect(axiosStub.getCalls().filter(call => call.args[0] === requestParams.url).length).to.be.equal(2);
    expect(retryPolicyStub.shouldRetry.calledOnceWith({ retriesInvoked: 0, error: sinon.match.any })).to.be.true;
    expect(retryPolicyStub.getSleepDurationInMs.calledOnceWith({ retriesInvoked: 0 })).to.be.true;
    // expect(sleepMock.calledOnceWith(1000)).to.be.true;
  });

  it.skip("does not call sleep before retry if sleep duration is 0", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };

    axiosStub = sinon.stub(axios, "post").throws({
      url: requestParams.url,
      statusCode: 503
    });
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
    expect((thrownError as IModelsApiError).statusCode).to.be.equal(503);
    expect(axiosStub.getCalls().filter(call => call.args[0] === requestParams.url).length).to.be.equal(4);

    expect(retryPolicyStub.shouldRetry.callCount).to.be.equal(3);
    expect(retryPolicyStub.shouldRetry.calledWithMatch({ retriesInvoked: 0, error: sinon.match.object })).to.be.true;
    expect(retryPolicyStub.shouldRetry.calledWithMatch({ retriesInvoked: 1, error: sinon.match.object })).to.be.true;
    expect(retryPolicyStub.shouldRetry.calledWithMatch({ retriesInvoked: 2, error: sinon.match.object })).to.be.true;

    expect(retryPolicyStub.getSleepDurationInMs.callCount).to.be.equal(3);
    expect(retryPolicyStub.getSleepDurationInMs.args[0][0]).to.deep.equal({ retriesInvoked: 0 });
    expect(retryPolicyStub.getSleepDurationInMs.args[1][0]).to.deep.equal({ retriesInvoked: 1 });
    expect(retryPolicyStub.getSleepDurationInMs.args[2][0]).to.deep.equal({ retriesInvoked: 2 });

    // expect(sleepMock.callCount).to.be.equal(0);
  });
});
