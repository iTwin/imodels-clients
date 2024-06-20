/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export interface ShouldRetryParams {
  /** The number of already invoked retries, starting from 0. */
  retriesInvoked: number;
  /** The error that was thrown when sending the HTTP request. */
  error: unknown;
}

export interface GetSleepDurationInMsParams {
  /** The number of already invoked retries, starting from 0. */
  retriesInvoked: number;
}

/** A policy for handling failed HTTP requests. */
export interface HttpRequestRetryPolicy {
  /** The maximum number of HTTP request retries. */
  get maxRetries(): number;

  /** Returns `true` if HTTP request should be retried, `false` otherwise. */
  shouldRetry(params: ShouldRetryParams): boolean | Promise<boolean>;

  /** Gets the duration to sleep in milliseconds before resending the HTTP request. */
  getSleepDurationInMs: (params: GetSleepDurationInMsParams) => number;
}
