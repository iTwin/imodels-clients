/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, Checkpoint, OperationsBase, PreferReturn, RecursiveRequired, flatten, getCollectionIterator, getCollectionPagesIterator, iModelScopedOperationParams, ChangesetResponse, map, NamedVersion } from "../../base";
import { Changeset, ChangesetsResponse, MinimalChangeset, MinimalChangesetsResponse } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { iModelsClientOptions } from "../../iModelsClient";
import { CheckpointOperations } from "../checkpoint/CheckpointOperations";
import { NamedVersionOperations } from "../namedVersion/NamedVersionOperations";
import { GetChangesetByIdParams, GetChangesetByIndexParams, GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  constructor(
    options: RecursiveRequired<iModelsClientOptions>,
    protected _namedVersionOperations: NamedVersionOperations,
    protected _checkpointOperations: CheckpointOperations
  ) {
    super(options);
  }

  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    const getEntityPageFunc = () => this.getEntityCollectionPage<MinimalChangeset>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalChangesetsResponse).changesets
    });

    const collection: AsyncIterableIterator<MinimalChangeset> = getCollectionIterator(getEntityPageFunc);
    return collection;
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    const pagedCollection: AsyncIterableIterator<Changeset[]> = this.getRepresentationListIntenal(params);
    const flattenedCollection: AsyncIterableIterator<Changeset> = flatten<Changeset>(pagedCollection);
    const mappedCollection: AsyncIterableIterator<Changeset> = map<Changeset, Changeset>( // TODO:
      flattenedCollection,
      changeset => this.appendRelatedEntityCallbacks(params.authorization, changeset)
    );
    return mappedCollection;
  }

  public async getById(params: GetChangesetByIdParams): Promise<Changeset> {
    const changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetId });
    return this.appendRelatedEntityCallbacks(params.authorization, changeset);
  }

  public async getByIndex(params: GetChangesetByIndexParams): Promise<Changeset> {
    const changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetIndex });
    return this.appendRelatedEntityCallbacks(params.authorization, changeset);
  }

  protected getRepresentationListIntenal(params: GetChangesetListParams): AsyncIterableIterator<Changeset[]> {
    const getEntityPageFunc = () => this.getEntityCollectionPage<Changeset>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse).changesets
    });

    return getCollectionPagesIterator(getEntityPageFunc);
  }

  protected async getByIdOrIndexInternal(params: iModelScopedOperationParams & { changesetIdOrIndex: string | number }): Promise<Changeset> {
    const response = await this.sendGetRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetUrl(params)
    });
    return response.changeset;
  }

  protected appendRelatedEntityCallbacks(authorization: AuthorizationCallback, changeset: Changeset): Changeset {
    const getNamedVersion = () => this.getNamedVersion(authorization, changeset._links.namedVersion?.href);
    const getCurrentOrPrecedingCheckpoint = () => this.getCurrentOrPrecedingCheckpoint(authorization, changeset._links.currentOrPrecedingCheckpoint?.href);

    const result: Changeset = {
      ...changeset,
      getNamedVersion,
      getCurrentOrPrecedingCheckpoint
    };

    return result;
  }
  
  private getNamedVersion(authorization: AuthorizationCallback, namedVersionLink: string | undefined): Promise<NamedVersion | undefined> {
    if (!namedVersionLink)
      return Promise.resolve(undefined);

    const { imodelId, namedVersionId } = this._urlFormatter.parseNamedVersionUrl(namedVersionLink);
    return this._namedVersionOperations.getById({
      authorization,
      imodelId,
      namedVersionId
    });
  }

  private getCurrentOrPrecedingCheckpoint(authorization: AuthorizationCallback, currentOrPrecedingCheckpointLink: string | undefined): Promise<Checkpoint | undefined> {
    if (!currentOrPrecedingCheckpointLink)
      return Promise.resolve(undefined);

    const { imodelId, changesetIndex } = this._urlFormatter.parseCheckpointUrl(currentOrPrecedingCheckpointLink);
    return this._checkpointOperations.getByChangesetIndex({
      authorization,
      imodelId,
      changesetIndex
    });
  }
}
