/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, UserPermissions } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetUserPermissionsParams } from "./UserPermissionOperationParams";

export class UserPermissionOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Retrieves permissions the user has for the specified iModel. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-user-permissions/ Get iModel User Permissions}
   * operation from iModels API. iModels permissions may be configured on a Project level or an iModel level.
   * This operation will return permissions configured for this specific iModel or Project permissions if iModel
   * permissions are not configured.
   * @param {GetUserPermissionsParams} params parameters for this operation. See {@link GetUserPermissionsParams}.
   * @returns {Promise<UserPermissions>} user permissions. See {@link UserPermissions}.
   */
  public async get(params: GetUserPermissionsParams): Promise<UserPermissions> {
    const response = await this.sendGetRequest<UserPermissions>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getUserPermissionsUrl({ iModelId: params.iModelId })
    });
    return response;
  }
}
