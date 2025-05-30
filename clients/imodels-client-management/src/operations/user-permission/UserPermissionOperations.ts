/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/internal";
import { UserPermissions } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetUserPermissionsParams } from "./UserPermissionOperationParams";

export class UserPermissionOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Retrieves Permissions the current user has for the specified iModel. The current user is determined based on
   * passed authorization information. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-user-permissions/ Get iModel User Permissions}
   * operation from iModels API. iModels Permissions may be configured on a iTwin level or an iModel level.
   * This operation will return Permissions configured for this specific iModel or iTwin Permissions if iModel
   * Permissions are not configured.
   * @param {GetUserPermissionsParams} params parameters for this operation. See {@link GetUserPermissionsParams}.
   * @returns {Promise<UserPermissions>} User Permissions. See {@link UserPermissions}.
   */
  public async get(params: GetUserPermissionsParams): Promise<UserPermissions> {
    const response = await this.sendGetRequest<UserPermissions>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getUserPermissionsUrl({
        iModelId: params.iModelId,
      }),
      headers: params.headers,
    });
    return response.body;
  }
}
