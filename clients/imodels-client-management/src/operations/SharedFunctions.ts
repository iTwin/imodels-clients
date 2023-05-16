/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, HeadersFactories, User } from "../base/types";

import { IModelsApiUrlFormatter } from "./IModelsApiUrlFormatter";
import { OperationOptions } from "./OperationOptions";
import { UserOperations } from "./user/UserOperations";

export async function getUser(
  authorization: AuthorizationCallback,
  userOperations: UserOperations<OperationOptions>,
  urlFormatter: IModelsApiUrlFormatter,
  userLink: string | undefined,
  headersFactories?: HeadersFactories
): Promise<User | undefined> {
  if (!userLink)
    return undefined;

  const { iModelId, userId } = urlFormatter.parseUserUrl(userLink);
  return userOperations.getSingle({
    authorization,
    iModelId,
    userId,
    headersFactories
  });
}
