/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetGroupResponse, ChangesetGroupsResponse, EntityListIteratorImpl, OperationsBase } from "../../base/internal";
import { AuthorizationCallback, EntityListIterator, HeaderFactories } from "../../base/types";
import { ChangesetGroup } from "../../base/types/apiEntities/ChangesetGroupInterfaces";
import { IModelsClient } from "../../IModelsClient";
import { OperationOptions } from "../OperationOptions";
import { getUser } from "../SharedFunctions";

import { GetChangesetGroupListParams, GetSingleChangesetGroupParams } from "./ChangesetGroupOperationParams";

export class ChangesetGroupOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
    private _iModelsClient: IModelsClient
  ) {
    super(options);
  }

  /**
   * Gets Changeset Groups for a specific iModel. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changeset-groups/ Get iModel Changeset Groups}
   * operation from iModels API.
   * @param {GetChangesetGroupListParams} params parameters for this operation. See {@link GetChangesetGroupListParams}.
   * @returns {EntityListIterator<ChangesetGroup>} iterator for Changeset Group list, which internally queries entities in pages.
   * See {@link EntityListIterator}, {@link ChangesetGroup}.
   */
  public getList(params: GetChangesetGroupListParams): EntityListIterator<ChangesetGroup> {
    const entityCollectionAccessor = (response: unknown) => {
      const changesetGroups = (response as ChangesetGroupsResponse).changesetGroups;
      const mappedChangesetGroups = changesetGroups.map((changesetGroup) =>
        this.appendRelatedEntityCallbacks(params.authorization, changesetGroup, params.headers));
      return mappedChangesetGroups;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<ChangesetGroup>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetGroupListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      entityCollectionAccessor,
      headers: params.headers
    }));
  }

  /**
   * Gets a single Changeset Group identified by id. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changeset-group-details/ Get iModel Changeset Group}
   * operation from iModels API.
   * @param {GetSingleChangesetGroupParams} params parameters for this operation. See {@link GetSingleChangesetGroupParams}.
   * @returns {Promise<ChangesetGroup>} a Changeset Group with the specified id. See {@link ChangesetGroup}.
   */
  public async getSingle(params: GetSingleChangesetGroupParams): Promise<ChangesetGroup> {
    const response = await this.sendGetRequest<ChangesetGroupResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleChangesetGroupUrl({ iModelId: params.iModelId, changesetGroupId: params.changesetGroupId }),
      headers: params.headers
    });

    const result: ChangesetGroup = this.appendRelatedEntityCallbacks(
      params.authorization,
      response.changesetGroup,
      params.headers
    );

    return result;
  }

  protected appendRelatedEntityCallbacks(authorization: AuthorizationCallback, changesetGroup: ChangesetGroup, headers?: HeaderFactories): ChangesetGroup {
    const getCreator = async () => getUser(
      authorization,
      this._iModelsClient.users,
      this._options.urlFormatter,
      changesetGroup._links.creator?.href,
      headers
    );

    const result: ChangesetGroup = {
      ...changesetGroup,
      getCreator
    };

    return result;
  }
}
