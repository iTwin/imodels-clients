/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../Constants";
import { IModelsError } from "../IModelsClientExports";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForCondition(params: {
  conditionToSatisfy: () => Promise<boolean>;
  timeoutErrorFactory: () => IModelsError;
  timeOutInMs?: number;
}): Promise<void> {
  const sleepPeriodInMs = Constants.time.sleepPeriodInMs;
  const timeOutInMs = params.timeOutInMs ?? Constants.time.iModelInitiazationTimeOutInMs;

  for (let retries = Math.ceil(timeOutInMs / sleepPeriodInMs); retries > 0; --retries) {
    const isTargetStateReached = await params.conditionToSatisfy();
    if (isTargetStateReached)
      return;
    await sleep(sleepPeriodInMs);
  }

  const timeoutError = params.timeoutErrorFactory();
  throw timeoutError;
}
