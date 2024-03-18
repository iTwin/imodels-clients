/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetGroupResponse } from "@itwin/imodels-client-management/lib/base/internal";
import { ChangesetGroupOperations as ManagementChangesetGroupOperations } from "@itwin/imodels-client-management/lib/operations";

import { ChangesetGroup } from "@itwin/imodels-client-management";

import { OperationOptions } from "../OperationOptions";

import { ChangesetGroupPropertiesForCreate, ChangesetGroupPropertiesForUpdate, CreateChangesetGroupParams, UpdateChangesetGroupParams } from "./ChangesetGroupOperationParams";

export class ChangesetGroupOperations<TOptions extends OperationOptions> extends ManagementChangesetGroupOperations<TOptions> {
  /**
   * Creates a Changeset Group. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel-changeset-group/ Create iModel Changeset Group}
   * operation from iModels API.
   * @param {CreateChangesetGroupParams} params parameters for this operation. See {@link CreateChangesetGroupParams}.
   * @returns {Promise<ChangesetGroup>} newly created Changeset Group. See {@link ChangesetGroup}.
   */
  public async create(params: CreateChangesetGroupParams): Promise<ChangesetGroup> {
    const createChangesetGroupBody = this.getCreateChangesetGroupRequestBody(params.changesetGroupProperties);
    const createChangesetGroupResponse = await this.sendPostRequest<ChangesetGroupResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetGroupListUrl({ iModelId: params.iModelId }),
      body: createChangesetGroupBody,
      headers: params.headers
    });
    const result = this.appendRelatedEntityCallbacks(params.authorization, createChangesetGroupResponse.data.changesetGroup, params.headers);
    return result;
  }

  /**
   * Closes an existing Changeset Group. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/update-imodel-changeset-group/ Update iModel Changeset Group}
   * operation from iModels API.
   * @param {UpdateChangesetGroupParams} params parameters for this operation. See {@link UpdateChangesetGroupParams}.
   * @returns {Promise<ChangesetGroup>} updated Changeset Group. See {@link ChangesetGroup}.
   */
  public async update(params: UpdateChangesetGroupParams): Promise<ChangesetGroup> {
    const updateChangesetGroupBody = this.getUpdateChangesetGroupRequestBody(params.changesetGroupProperties);
    const updateChangesetGroupResponse = await this.sendPatchRequest<ChangesetGroupResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleChangesetGroupUrl({ iModelId: params.iModelId, changesetGroupId: params.changesetGroupId }),
      body: updateChangesetGroupBody,
      headers: params.headers
    });
    const result = this.appendRelatedEntityCallbacks(params.authorization, updateChangesetGroupResponse.data.changesetGroup, params.headers);
    return result;
  }

  private getCreateChangesetGroupRequestBody(changesetGroupProperties: ChangesetGroupPropertiesForCreate): object {
    return {
      description: changesetGroupProperties.description
    };
  }

  private getUpdateChangesetGroupRequestBody(changesetGroupProperties: ChangesetGroupPropertiesForUpdate): object {
    return {
      state: changesetGroupProperties.state
    };
  }
}
