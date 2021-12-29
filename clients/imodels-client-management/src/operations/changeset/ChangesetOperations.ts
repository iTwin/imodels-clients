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

  /**
   * Gets Changesets for a specific iModel. This method returns Changesets in their minimal representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-changesets/ Get iModel Changesets}
   * operation from iModels API.
   * @param {GetChangesetListParams} params parameters for this operation. See {@link GetChangesetListParams}.
   * @returns {EntityListIterator<MinimalChangeset>} iterator for Changeset list. See {@link EntityListIterator},
   * {@link MinimalChangeset}.
   */
  public getMinimalList(params: GetChangesetListParams): EntityListIterator<MinimalChangeset> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalChangeset>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as MinimalChangesetsResponse).changesets
    }));
  }

  /**
   * Gets Changesets for a specific iModel. This method returns Changesets in their full representation. The returned
   * iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-changesets/ Get iModel Changesets}
   * operation from iModels API.
   * @param {GetChangesetListParams} params parameters for this operation. See {@link GetChangesetListParams}.
   * @returns {EntityListIterator<Changeset>} iterator for Changeset list. See {@link EntityListIterator},
   * {@link Changeset}.
   */
  public getRepresentationList(params: GetChangesetListParams): EntityListIterator<Changeset> {
    const entityCollectionAccessor = (response: unknown) => {
      const changesets = (response as ChangesetsResponse).changesets;
      const mappedChangesets = changesets.map((changeset) => this.appendRelatedEntityCallbacks(params.authorization, changeset));
      return mappedChangesets;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<Changeset>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor
    }));
  }

  /**
   * Gets a single Changeset identified by either index or id. This method returns a Changeset in its full
   * representation. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-changeset-details/
   * Get iModel Changeset} operation from iModels API.
   * @param {GetSingleChangesetParams} params parameters for this operation. See {@link GetSingleChangesetParams}.
   * @returns {Promise<Changeset>} a Changeset with specified id or index. See {@link Changeset}.
   */
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
