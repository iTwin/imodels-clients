/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, PreferReturn, flatten, getCollectionIterator, getCollectionPagesIterator } from "../../base";
import { Changeset, ChangesetResponse, ChangesetsResponse, MinimalChangeset } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { GetChangesetByIdParams, GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    return getCollectionIterator(() => this.getEntityCollectionPage<MinimalChangeset>({
      authorization: params.authorization,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse<MinimalChangeset>).changesets
    }));
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    return flatten(this.getRepresentationListInPages(params));
  }

  protected getRepresentationListInPages(params: GetChangesetListParams): AsyncIterableIterator<Changeset[]> {
    return getCollectionPagesIterator(() => this.getEntityCollectionPage<Changeset>({
      authorization: params.authorization,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse<Changeset>).changesets
    }));
  }

  public async getById(params: GetChangesetByIdParams): Promise<Changeset> {
    const response = await this.sendGetRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetId}`
    });
    return response.changeset;
  }
}
