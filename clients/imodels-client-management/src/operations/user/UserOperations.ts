/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIterator, EntityListIteratorImpl, MinimalUser, MinimalUsersResponse, OperationsBase, PreferReturn, User, UserResponse, UsersResponse } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetSingleUserParams, GetUserListParams } from "./UserOperationParams";

export class UserOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /** Gets Users who have ever been connected to the iModel specified by the iModel id. This method returns Users in
   * their minimal representation. The returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-users/ Get iModel Users}
   * operation from iModels API.
   * @param {GetUserListParams} params parameters for this operation. See {@link GetUserListParams}.
   * @returns {EntityListIterator<MinimalUser>} iterator for User list. See {@link EntityListIterator}, {@link MinimalUser}.
   */
  public getMinimalList(params: GetUserListParams): EntityListIterator<MinimalUser> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalUser>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getUserListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalUsersResponse).users
    }));
  }

  /**
   * Gets Users who have ever been connected to the iModel specified by the iModel id. This method returns Users in their
   * full representation. The returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-users/ Get iModel Users}
   * operation from iModels API.
   * @param {GetUserListParams} params parameters for this operation. See {@link GetUserListParams}.
   * @returns {EntityListIterator<User>} iterator for User list. See {@link EntityListIterator}, {@link User}.
   */
  public getRepresentationList(params: GetUserListParams): EntityListIterator<User> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<User>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getUserListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as UsersResponse).users
    }));
  }

  /**
   * Gets a single User by its id. This method returns a User in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-user-details/ Get iModel User}
   * operation from iModels API.
   * @param {GetSingleUserParams} params parameters for this operation. See {@link GetSingleUserParams}.
   * @returns {Promise<User>} a User with specified id. See {@link User}.
   */
  public async getSingle(params: GetSingleUserParams): Promise<User> {
    const response = await this.sendGetRequest<UserResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleUserUrl({ iModelId: params.iModelId, userId: params.userId })
    });
    return response.user;
  }
}
