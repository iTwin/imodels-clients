/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ErrorAdapter, OperationNameForErrorMapping } from "./ErrorAdapter.js";

export async function handleAPIErrors<TResult>(
  func: () => Promise<TResult>,
  operationName?: OperationNameForErrorMapping
): Promise<TResult> {
  try {
    const result = await func();
    return result;
  } catch (error: unknown) {
    throw ErrorAdapter.toITwinError(error, operationName);
  }
}
