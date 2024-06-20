/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Backoff algorithm for calculating sleep time after a failed HTTP request. */
export interface BackoffAlgorithm {
  /** Calculates the sleep duration in milliseconds. */
  getSleepDurationInMs: (attempt: number) => number;
}

/**
 * Exponential backoff algorithm for calculating sleep time after a failed HTTP request.
 * Default implementation for {@link BackoffAlgorithm}.
 */
export class ExponentialBackoffAlgorithm implements BackoffAlgorithm {
  private readonly _baseDelayInMs: number;
  private readonly _factor: number;

  public constructor(
    baseDelayInMs: number = 300,
    factor: number = 3
  ) {
    this._baseDelayInMs = baseDelayInMs;
    this._factor = factor;
  }

  public getSleepDurationInMs(attempt: number): number {
    return Math.pow(this._factor, attempt) * this._baseDelayInMs;
  }
}
