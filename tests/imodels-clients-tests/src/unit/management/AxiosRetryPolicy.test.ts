/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosError, AxiosHeaders } from "axios";
import { expect } from "chai";
import sinon from "sinon";

import {
  AxiosRetryPolicy,
  ExponentialBackoffAlgorithm,
  GetSleepDurationInMsParams,
} from "@itwin/imodels-client-management";

import { createStub } from "../Stubs";

describe("[Management] AxiosRetryPolicy", () => {
  let backoffAlgorithmStub: sinon.SinonStubbedInstance<ExponentialBackoffAlgorithm>;

  before(() => {
    backoffAlgorithmStub = createStub(ExponentialBackoffAlgorithm);
  });

  it("should use provided backoff algorithm when calculating sleep duration", () => {
    // Arrange
    const testedClass = new AxiosRetryPolicy({
      backoffAlgorithm: backoffAlgorithmStub,
      maxRetries: 3,
    });
    const params: GetSleepDurationInMsParams = { retriesInvoked: 2 };
    const expectedSleepDuration = 1000;
    backoffAlgorithmStub.getSleepDurationInMs
      .withArgs(params.retriesInvoked)
      .returns(expectedSleepDuration);

    // Act
    const actualSleepDuration = testedClass.getSleepDurationInMs(params);

    // Assert
    expect(actualSleepDuration).to.be.equal(expectedSleepDuration);
    expect(
      backoffAlgorithmStub.getSleepDurationInMs.calledOnceWith(
        params.retriesInvoked
      )
    ).to.be.true;
  });

  const createAxiosError = (status: number) => {
    const request = { path: "foo" };
    const headers = new AxiosHeaders();
    const config = {
      url: "bar",
      headers,
    };
    return new AxiosError("Message", "Code", config, request, {
      status,
      data: {},
      statusText: "",
      config,
      headers,
    });
  };

  [
    {
      label: "axios 404 error",
      error: createAxiosError(404),
      expectedShouldRetry: false,
    },
    {
      label: "axios 408 error",
      error: createAxiosError(408),
      expectedShouldRetry: false,
    },
    {
      label: "axios 429 error",
      error: createAxiosError(429),
      expectedShouldRetry: false,
    },
    {
      label: "axios 500 error",
      error: createAxiosError(500),
      expectedShouldRetry: true,
    },
    {
      label: "axios 503 error",
      error: createAxiosError(503),
      expectedShouldRetry: true,
    },
    {
      label: "non-axios error",
      error: new Error("Not an axios error"),
      expectedShouldRetry: true,
    },
  ].forEach((testCase) => {
    it(`should return ${testCase.expectedShouldRetry} when HTTP request fails with ${testCase.label}`, () => {
      // Arrange
      const testedClass = new AxiosRetryPolicy({
        backoffAlgorithm: backoffAlgorithmStub,
        maxRetries: 3,
      });

      // Act & Assert
      expect(
        testedClass.shouldRetry({ retriesInvoked: 0, error: testCase.error })
      ).to.be.equal(testCase.expectedShouldRetry);
    });
  });
});
