/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, IModelScopedOperationParams } from "../../IModelsClientExports";

/** Parameters for get User list operation. */
export interface GetUserListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: CollectionRequestParams;
}

/** Parameters for get single User operation. */
export interface GetSingleUserParams extends IModelScopedOperationParams {
  /** User id. */
  userId: string;
}
