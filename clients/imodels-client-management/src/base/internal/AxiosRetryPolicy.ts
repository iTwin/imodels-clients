/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { isAxiosError } from "axios";

import { Constants } from "../../Constants";
import { GetSleepDurationInMsParams, HttpRequestRetryPolicy, ShouldRetryParams } from "../types";

import { BackoffAlgorithm } from "./ExponentialBackoffAlgorithm";

/** Default implementation for {@link HttpRequestRetryPolicy}. */
export class AxiosRetryPolicy implements HttpRequestRetryPolicy {
  private readonly _backoffAlgorithm: BackoffAlgorithm;

  public constructor(
    backoffAlgorithm: BackoffAlgorithm,
    maxRetries: number = 3
  ) {
    this.maxRetries = maxRetries;
    this._backoffAlgorithm = backoffAlgorithm;
  }

  public readonly maxRetries: number;

  public shouldRetry(params: ShouldRetryParams): boolean {
    if (isAxiosError(params.error) && params.error.response?.status != null) {
      return (
        params.error.response.status === Constants.httpStatusCodes.requestTimeout ||
        params.error.response.status >= Constants.httpStatusCodes.internalServerError
      );
    }

    return true;
  }

  public getSleepDurationInMs(params: GetSleepDurationInMsParams): number {
    return this._backoffAlgorithm.getSleepDurationInMs(params.retriesInvoked);
  }
}
