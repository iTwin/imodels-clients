/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  IModelScopedOperationParams,
  OrderableCollectionRequestParams,
  User,
} from "../../base/types";

/**
 * User entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum UserOrderByProperty {
  GivenName = "givenName",
  Surname = "surname",
}

/** Parameters for get User list operation. */
export interface GetUserListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: OrderableCollectionRequestParams<User, UserOrderByProperty>;
}

/** Parameters for get single User operation. */
export interface GetSingleUserParams extends IModelScopedOperationParams {
  /** User id. */
  userId: string;
}
