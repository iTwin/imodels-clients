/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ErrorAdapter } from "./interface-adapters/ErrorAdapter";

export async function handleAPIErrors<TResult>(func: () => Promise<TResult>): Promise<TResult> {
  try {
    const result = await func();
    return result;
  } catch (error: unknown) {
    throw ErrorAdapter.toIModelError(error);
  }
}