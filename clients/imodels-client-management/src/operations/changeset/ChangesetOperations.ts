/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, PreferReturn, flatten, getCollectionIterator, getCollectionPagesIterator, iModelScopedOperationParams, map, Checkpoint, RecursiveRequired, AuthorizationCallback } from "../../base";
import { Changeset, ChangesetApiModel, ChangesetResponseApiModel, ChangesetsResponseApiModel, MinimalChangeset, MinimalChangesetApiModel, MinimalChangesetsResponseApiModel } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { iModelsClientOptions } from "../../iModelsClient";
import { CheckpointOperations } from "../checkpoint/CheckpointOperations";
import { GetChangesetByIdParams, GetChangesetByIndexParams, GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  private _checkpointOperations: CheckpointOperations;

  constructor(options: RecursiveRequired<iModelsClientOptions>, checkpointOperations: CheckpointOperations) {
    super(options);
    this._checkpointOperations = checkpointOperations;
  }

  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    const getEntityPageFunc = () => this.getEntityCollectionPage<MinimalChangesetApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalChangesetsResponseApiModel).changesets
    })

    const collection: AsyncIterableIterator<MinimalChangesetApiModel> = getCollectionIterator(getEntityPageFunc);
    const mappedCollection: AsyncIterableIterator<MinimalChangeset> = map<MinimalChangesetApiModel, MinimalChangeset>(collection, this.mapMinimalChangeset);
    return mappedCollection;
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    const pagedCollection: AsyncIterableIterator<ChangesetApiModel[]> = this.getRepresentationListIntenal(params);
    const flattenedCollection: AsyncIterableIterator<ChangesetApiModel> = flatten<ChangesetApiModel>(pagedCollection);
    const mappedCollection: AsyncIterableIterator<Changeset> = map<ChangesetApiModel, Changeset>(
      flattenedCollection,
      changeset => this.mapChangeset(params.authorization, changeset)
    );
    return mappedCollection;
  }

  public async getById(params: GetChangesetByIdParams): Promise<Changeset> {
    const changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetId });
    return this.mapChangeset(params.authorization, changeset);
  }

  public async getByIndex(params: GetChangesetByIndexParams): Promise<Changeset> {
    const changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetIndex });
    return this.mapChangeset(params.authorization, changeset);
  }

  protected getRepresentationListIntenal(params: GetChangesetListParams): AsyncIterableIterator<ChangesetApiModel[]> {
    const getEntityPageFunc = () => this.getEntityCollectionPage<ChangesetApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponseApiModel).changesets
    })

    return getCollectionPagesIterator(getEntityPageFunc);
  }

  protected async getByIdOrIndexInternal(params: iModelScopedOperationParams & { changesetIdOrIndex: string | number }): Promise<ChangesetApiModel> {
    const response = await this.sendGetRequest<ChangesetResponseApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params)
    });
    return response.changeset;
  }

  private mapMinimalChangeset(changeset: MinimalChangesetApiModel): MinimalChangeset {
    return changeset;
  }

  protected mapChangeset(authorization: AuthorizationCallback, changeset: ChangesetApiModel): Changeset {
    const { _links: changesetLinks, ...changesetProperties } = changeset;
    const result: Changeset = changesetProperties;

    if (changesetLinks.currentOrPrecedingCheckpoint) {
      result.getCurrentOrPrecedingCheckpoint =
        () => this.getCurrentOrPrecedingCheckpoint(authorization, changesetLinks.currentOrPrecedingCheckpoint!.href);
    }

    return result;
  }

  private getCurrentOrPrecedingCheckpoint(authorization: AuthorizationCallback, currentOrPrecedingCheckpointLink: string): Promise<Checkpoint> {
    const { imodelId, changesetIndex } = this._urlFormatter.parseCheckpointUrl(currentOrPrecedingCheckpointLink);
    return this._checkpointOperations.getByChangesetIndex({
      authorization,
      imodelId,
      changesetIndex
    });
  }
}