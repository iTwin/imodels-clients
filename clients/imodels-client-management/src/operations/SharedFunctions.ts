/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, HeaderFactories, User } from "../base/types";

import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter";
import { OperationOptions } from "./OperationOptions";
import { UserOperations } from "./user/UserOperations";

export async function getUser(
  authorization: AuthorizationCallback,
  userOperations: UserOperations<OperationOptions>,
  urlFormatter: IModelsApiUrlFormatter,
  userLink: string | undefined,
  headers?: HeaderFactories
): Promise<User | undefined> {
  if (!userLink)
    return undefined;

  const { iModelId, userId } = urlFormatter.parseUserUrl(userLink);
  return userOperations.getSingle({
    authorization,
    iModelId,
    userId,
    headers
  });
}

export function assertStringHeaderValue(headerName: string, headerValue: unknown): asserts headerValue is string {
  const isString = typeof headerValue === "string" || headerValue instanceof String;
  if (!isString)
    throw new Error(`Assertion failed: header's ${headerName} value is not a string.`);
}
