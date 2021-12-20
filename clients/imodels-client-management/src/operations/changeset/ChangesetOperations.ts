/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, ChangesetResponse, Checkpoint, EntityListIterator, EntityListIteratorImpl, NamedVersion, OperationsBase, PreferReturn } from "../../base";
import { Changeset, ChangesetsResponse, MinimalChangeset, MinimalChangesetsResponse } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { CheckpointOperations } from "../checkpoint/CheckpointOperations";
import { NamedVersionOperations } from "../named-version/NamedVersionOperations";
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

  public getMinimalList(params: GetChangesetListParams): EntityListIterator<MinimalChangeset> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalChangeset>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalChangesetsResponse).changesets
    }));
  }

  public getRepresentationList(params: GetChangesetListParams): EntityListIterator<Changeset> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<Changeset>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as ChangesetsResponse).changesets
    }));
  }

  public async getSingle(params: GetSingleChangesetParams): Promise<Changeset> {
    const changeset: Changeset = await this.querySingleInternal(params);
    const result: Changeset = this.appendRelatedEntityCallbacks(params.authorization, changeset);
    return result;
  }

  protected async querySingleInternal(params: GetSingleChangesetParams): Promise<Changeset> {
    const { authorization, iModelId, ...changesetIdOrIndex } = params;
    const response = await this.sendGetRequest<ChangesetResponse>({
      authorization,
      url: this._options.urlFormatter.getSingleChangesetUrl({ iModelId, ...changesetIdOrIndex })
    });
    return response.changeset;
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
      return undefined;

    const { iModelId, namedVersionId } = this._options.urlFormatter.parseNamedVersionUrl(namedVersionLink);
    return this._namedVersionOperations.getSingle({
      authorization,
      iModelId,
      namedVersionId
    });
  }

  private async getCurrentOrPrecedingCheckpoint(authorization: AuthorizationCallback, currentOrPrecedingCheckpointLink: string | undefined): Promise<Checkpoint | undefined> {
    if (!currentOrPrecedingCheckpointLink)
      return undefined;

    const { iModelId, changesetIndex } = this._options.urlFormatter.parseCheckpointUrl(currentOrPrecedingCheckpointLink);
    return this._checkpointOperations.getSingle({
      authorization,
      iModelId,
      changesetIndex
    });
  }
}
