/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, ChangesetResponse, Checkpoint, NamedVersion, OperationsBase, PreferReturn, flatten, getCollectionIterator, getCollectionPagesIterator, map } from "../../base";
import { Changeset, ChangesetsResponse, MinimalChangeset, MinimalChangesetsResponse } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { CheckpointOperations } from "../checkpoint/CheckpointOperations";
import { NamedVersionOperations } from "../namedVersion/NamedVersionOperations";
import { OperationOptions } from "../OperationOptions";
import { GetChangesetListParams, GetSingleChangesetParams } from "./ChangesetOperationParams";

export class ChangesetOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
    protected _namedVersionOperations: NamedVersionOperations<TOptions>,
    protected _checkpointOperations: CheckpointOperations<TOptions>
  ) {
    super(options);
  }

  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    const getEntityPageFunc = async () => this.getEntityCollectionPage<MinimalChangeset>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalChangesetsResponse).changesets
    });

    const collection: AsyncIterableIterator<MinimalChangeset> = getCollectionIterator(getEntityPageFunc);
    return collection;
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    const pagedCollection: AsyncIterableIterator<Changeset[]> = this.getRepresentationListInternal(params);
    const flattenedCollection: AsyncIterableIterator<Changeset> = flatten<Changeset>(pagedCollection);
    const mappedCollection: AsyncIterableIterator<Changeset> = map<Changeset, Changeset>(
      flattenedCollection,
      (changeset) => this.appendRelatedEntityCallbacks(params.authorization, changeset)
    );
    return mappedCollection;
  }

  public async getSingle(params: GetSingleChangesetParams): Promise<Changeset> {
    const changeset: Changeset = await this.querySingleInternal(params);
    const result: Changeset  = this.appendRelatedEntityCallbacks(params.authorization, changeset);
    return result;
  }

  protected async querySingleInternal(params: GetSingleChangesetParams): Promise<Changeset> {
    const response = await this.sendGetRequest<ChangesetResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetUrl(params)
    });
    return response.changeset;
  }

  protected getRepresentationListInternal(params: GetChangesetListParams): AsyncIterableIterator<Changeset[]> {
    const getEntityPageFunc = async () => this.getEntityCollectionPage<Changeset>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetsUrl(params),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse).changesets
    });

    return getCollectionPagesIterator(getEntityPageFunc);
  }

  protected appendRelatedEntityCallbacks(authorization: AuthorizationCallback, changeset: Changeset): Changeset {
    const getNamedVersion = async () => this.getNamedVersion(authorization, changeset._links.namedVersion?.href);
    const getCurrentOrPrecedingCheckpoint = async () => this.getCurrentOrPrecedingCheckpoint(authorization, changeset._links.currentOrPrecedingCheckpoint?.href);

    const result: Changeset = {
      ...changeset,
      getNamedVersion,
      getCurrentOrPrecedingCheckpoint
    };

    return result;
  }

  private async getNamedVersion(authorization: AuthorizationCallback, namedVersionLink: string | undefined): Promise<NamedVersion | undefined> {
    if (!namedVersionLink)
      return Promise.resolve(undefined);

    const { imodelId, namedVersionId } = this._options.urlFormatter.parseNamedVersionUrl(namedVersionLink);
    return this._namedVersionOperations.getSingle({
      authorization,
      imodelId,
      namedVersionId
    });
  }

  private async getCurrentOrPrecedingCheckpoint(authorization: AuthorizationCallback, currentOrPrecedingCheckpointLink: string | undefined): Promise<Checkpoint | undefined> {
    if (!currentOrPrecedingCheckpointLink)
      return Promise.resolve(undefined);

    const { imodelId, changesetIndex } = this._options.urlFormatter.parseCheckpointUrl(currentOrPrecedingCheckpointLink);
    return this._checkpointOperations.getSingle({
      authorization,
      imodelId,
      changesetIndex
    });
  }
}
