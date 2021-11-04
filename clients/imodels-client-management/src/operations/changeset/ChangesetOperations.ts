/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, Checkpoint, OperationsBase, PreferReturn, RecursiveRequired, flatten, getCollectionIterator, getCollectionPagesIterator, iModelScopedOperationParams, map, NamedVersion } from "../../base";
import { Changeset, ChangesetApiModel, ChangesetResponseApiModel, ChangesetsResponseApiModel, MinimalChangeset, MinimalChangesetApiModel, MinimalChangesetsResponseApiModel } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { iModelsClientOptions } from "../../iModelsClient";
import { CheckpointOperations } from "../checkpoint/CheckpointOperations";
import { NamedVersionOperations } from "../namedVersion/NamedVersionOperations";
import { GetChangesetByIdParams, GetChangesetByIndexParams, GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  constructor(
    options: RecursiveRequired<iModelsClientOptions>,
    private _namedVersionOperations: NamedVersionOperations,
    private _checkpointOperations: CheckpointOperations
  ) {
    super(options);
  }

  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    const getEntityPageFunc = () => this.getEntityCollectionPage<MinimalChangesetApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalChangesetsResponseApiModel).changesets
    });

    const collection: AsyncIterableIterator<MinimalChangesetApiModel> = getCollectionIterator(getEntityPageFunc);
    const mappedCollection: AsyncIterableIterator<MinimalChangeset> = map<MinimalChangesetApiModel, MinimalChangeset>(collection, this.convertToMinimalChangeset);
    return mappedCollection;
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    const pagedCollection: AsyncIterableIterator<ChangesetApiModel[]> = this.getRepresentationListIntenal(params);
    const flattenedCollection: AsyncIterableIterator<ChangesetApiModel> = flatten<ChangesetApiModel>(pagedCollection);
    const mappedCollection: AsyncIterableIterator<Changeset> = map<ChangesetApiModel, Changeset>(
      flattenedCollection,
      changeset => this.convertToChangeset(params.authorization, changeset)
    );
    return mappedCollection;
  }

  public async getById(params: GetChangesetByIdParams): Promise<Changeset> {
    const changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetId });
    return this.convertToChangeset(params.authorization, changeset);
  }

  public async getByIndex(params: GetChangesetByIndexParams): Promise<Changeset> {
    const changeset = await this.getByIdOrIndexInternal({ ...params, changesetIdOrIndex: params.changesetIndex });
    return this.convertToChangeset(params.authorization, changeset);
  }

  protected getRepresentationListIntenal(params: GetChangesetListParams): AsyncIterableIterator<ChangesetApiModel[]> {
    const getEntityPageFunc = () => this.getEntityCollectionPage<ChangesetApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponseApiModel).changesets
    });

    return getCollectionPagesIterator(getEntityPageFunc);
  }

  protected async getByIdOrIndexInternal(params: iModelScopedOperationParams & { changesetIdOrIndex: string | number }): Promise<ChangesetApiModel> {
    const response = await this.sendGetRequest<ChangesetResponseApiModel>({
      authorization: params.authorization,
      url: this._urlFormatter.getChangesetsUrl(params)
    });
    return response.changeset;
  }

  private convertToMinimalChangeset(changeset: MinimalChangesetApiModel): MinimalChangeset {
    return changeset; // todo: manual property map?
  }

  protected convertToChangeset(authorization: AuthorizationCallback, changeset: ChangesetApiModel): Changeset {
    const { _links: changesetLinks, ...changesetProperties } = changeset;
    const result: Changeset = changesetProperties;

    if (changesetLinks.namedVersion)
      result.getNamedVersion = () => this.getNamedVersion(authorization, changesetLinks.namedVersion!.href);

    if (changesetLinks.currentOrPrecedingCheckpoint)
      result.getCurrentOrPrecedingCheckpoint = () => this.getCurrentOrPrecedingCheckpoint(authorization, changesetLinks.currentOrPrecedingCheckpoint!.href);

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

  private getNamedVersion(authorization: AuthorizationCallback, namedVersionLink: string): Promise<NamedVersion> {
    const { imodelId, namedVersionId } = this._urlFormatter.parseNamedVersionUrl(namedVersionLink);
    return this._namedVersionOperations.getById({
      authorization,
      imodelId,
      namedVersionId
    });
  }
}
