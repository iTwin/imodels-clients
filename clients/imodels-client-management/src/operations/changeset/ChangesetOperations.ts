/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ChangesetResponse,
  ChangesetsResponse,
  EntityListIteratorImpl,
  OperationsBase,
} from "../../base/internal";
import {
  AuthorizationCallback,
  Changeset,
  Checkpoint,
  EntityListIterator,
  HeaderFactories,
  HttpResponse,
  MinimalChangeset,
  NamedVersion,
  PreferReturn,
} from "../../base/types";
import { IModelsClient } from "../../IModelsClient";
import { OperationOptions } from "../OperationOptions";
import { getUser } from "../SharedFunctions";

import {
  GetChangesetListParams,
  GetSingleChangesetParams,
} from "./ChangesetOperationParams";

export class ChangesetOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  constructor(options: TOptions, private _iModelsClient: IModelsClient) {
    super(options);
  }

  /**
   * Gets Changesets for a specific iModel. This method returns Changesets in their minimal representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changesets/ Get iModel Changesets}
   * operation from iModels API.
   * @param {GetChangesetListParams} params parameters for this operation. See {@link GetChangesetListParams}.
   * @returns {EntityListIterator<MinimalChangeset>} iterator for Changeset list. See {@link EntityListIterator},
   * {@link MinimalChangeset}.
   */
  public getMinimalList(
    params: GetChangesetListParams
  ): EntityListIterator<MinimalChangeset> {
    const entityCollectionAccessor = (
      response: HttpResponse<ChangesetsResponse<MinimalChangeset>>
    ) => {
      const changesets = response.body.changesets;
      const mappedChangesets = changesets.map((changeset) =>
        this.appendRelatedMinimalEntityCallbacks(
          params.authorization,
          changeset,
          params.headers
        )
      );
      return mappedChangesets;
    };

    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalChangeset,
        ChangesetsResponse<MinimalChangeset>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getChangesetListUrl({
          iModelId: params.iModelId,
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets Changesets for a specific iModel. This method returns Changesets in their full representation. The returned
   * iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changesets/ Get iModel Changesets}
   * operation from iModels API.
   * @param {GetChangesetListParams} params parameters for this operation. See {@link GetChangesetListParams}.
   * @returns {EntityListIterator<Changeset>} iterator for Changeset list. See {@link EntityListIterator},
   * {@link Changeset}.
   */
  public getRepresentationList(
    params: GetChangesetListParams
  ): EntityListIterator<Changeset> {
    const entityCollectionAccessor = (
      response: HttpResponse<ChangesetsResponse<Changeset>>
    ) => {
      const changesets = response.body.changesets;
      const mappedChangesets = changesets.map((changeset) =>
        this.appendRelatedEntityCallbacks(
          params.authorization,
          changeset,
          params.headers
        )
      );
      return mappedChangesets;
    };

    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<Changeset, ChangesetsResponse<Changeset>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getChangesetListUrl({
          iModelId: params.iModelId,
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets a single Changeset identified by either index or id. This method returns a Changeset in its full representation.
   * Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changeset-details/ Get iModel Changeset}
   * operation from iModels API.
   * @param {GetSingleChangesetParams} params parameters for this operation. See {@link GetSingleChangesetParams}.
   * @returns {Promise<Changeset>} a Changeset with specified id or index. See {@link Changeset}.
   */
  public async getSingle(params: GetSingleChangesetParams): Promise<Changeset> {
    const changeset: Changeset = await this.querySingleInternal(params);
    return changeset;
  }

  protected async querySingleInternal(
    params: GetSingleChangesetParams
  ): Promise<Changeset> {
    const { authorization, iModelId, headers, ...changesetIdOrIndex } = params;
    const response = await this.sendGetRequest<ChangesetResponse>({
      authorization,
      url: this._options.urlFormatter.getSingleChangesetUrl({
        iModelId,
        ...changesetIdOrIndex,
      }),
      headers,
    });
    const result: Changeset = this.appendRelatedEntityCallbacks(
      params.authorization,
      response.body.changeset,
      params.headers
    );
    return result;
  }

  protected appendRelatedMinimalEntityCallbacks<
    TChangeset extends MinimalChangeset
  >(
    authorization: AuthorizationCallback,
    changeset: TChangeset,
    headers?: HeaderFactories
  ): TChangeset {
    const getCreator = async () =>
      getUser(
        authorization,
        this._iModelsClient.users,
        this._options.urlFormatter,
        changeset._links.creator?.href,
        headers
      );

    const result: TChangeset = {
      ...changeset,
      getCreator,
    };

    return result;
  }

  protected appendRelatedEntityCallbacks(
    authorization: AuthorizationCallback,
    changeset: Changeset,
    headers?: HeaderFactories
  ): Changeset {
    const getNamedVersion = async () =>
      this.getNamedVersion(
        authorization,
        changeset._links.namedVersion?.href,
        headers
      );
    const getCurrentOrPrecedingCheckpoint = async () =>
      this.getCurrentOrPrecedingCheckpoint(
        authorization,
        changeset._links.currentOrPrecedingCheckpoint?.href,
        headers
      );

    const changesetWithMinimalCallbacks =
      this.appendRelatedMinimalEntityCallbacks(
        authorization,
        changeset,
        headers
      );
    const result: Changeset = {
      ...changesetWithMinimalCallbacks,
      getNamedVersion,
      getCurrentOrPrecedingCheckpoint,
    };

    return result;
  }

  private async getNamedVersion(
    authorization: AuthorizationCallback,
    namedVersionLink: string | undefined,
    headers: HeaderFactories | undefined
  ): Promise<NamedVersion | undefined> {
    if (!namedVersionLink) return undefined;

    const { iModelId, namedVersionId } =
      this._options.urlFormatter.parseNamedVersionUrl(namedVersionLink);
    return this._iModelsClient.namedVersions.getSingle({
      authorization,
      iModelId,
      namedVersionId,
      headers,
    });
  }

  private async getCurrentOrPrecedingCheckpoint(
    authorization: AuthorizationCallback,
    currentOrPrecedingCheckpointLink: string | undefined,
    headers: HeaderFactories | undefined
  ): Promise<Checkpoint | undefined> {
    if (!currentOrPrecedingCheckpointLink) return undefined;

    const entityIds = this._options.urlFormatter.parseCheckpointUrl(
      currentOrPrecedingCheckpointLink
    );
    return this._iModelsClient.checkpoints.getSingle({
      authorization,
      ...entityIds,
      headers,
    });
  }
}
