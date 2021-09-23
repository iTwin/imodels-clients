/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, PreferReturn, getPagedCollectionGenerator } from "../../base";
import { Changeset, ChangesetResponse, ChangesetsResponse, MinimalChangeset } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { GetChangesetByIdParams, GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<MinimalChangeset>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: ChangesetsResponse<MinimalChangeset>) => response.changesets
    }));
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<Changeset>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: ChangesetsResponse<Changeset>) => response.changesets
    }));
  }

  public async getById(params: GetChangesetByIdParams): Promise<Changeset> {
    const response = await this.sendGetRequest<ChangesetResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetId}`
    });
    return response.changeset;
  }
}
