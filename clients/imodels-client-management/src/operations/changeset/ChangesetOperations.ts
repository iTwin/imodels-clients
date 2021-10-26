/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, PreferReturn, flatten, getCollectionIterator, getCollectionPagesIterator, iModelScopedOperationParams } from "../../base";
import { Changeset, ChangesetResponse, ChangesetsResponse, MinimalChangeset } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { GetChangesetByIdParams, GetChangesetByIndexParams, GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    return getCollectionIterator(() => this.getEntityCollectionPage<MinimalChangeset>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse<MinimalChangeset>).changesets
    }));
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    return flatten(this.getRepresentationListInPages(params));
  }

  public getById(params: GetChangesetByIdParams): Promise<Changeset> {
    return this.getByIdOrIndex({ ...params, changesetIdOrIndex: params.changesetId });
  }

  public getByIndex(params: GetChangesetByIndexParams): Promise<Changeset> {
    return this.getByIdOrIndex({ ...params, changesetIdOrIndex: params.changesetIndex });
  }

  protected getRepresentationListInPages(params: GetChangesetListParams): AsyncIterableIterator<Changeset[]> {
    return getCollectionPagesIterator(() => this.getEntityCollectionPage<Changeset>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse<Changeset>).changesets
    }));
  }

  private async getByIdOrIndex(params: iModelScopedOperationParams & { changesetIdOrIndex: string | number }): Promise<Changeset> {
    const response = await this.sendGetRequest<ChangesetResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetIdOrIndex}`
    });
    return response.changeset;
  }
}
