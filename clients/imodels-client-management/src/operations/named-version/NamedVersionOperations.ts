/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIteratorImpl, NamedVersionResponse, NamedVersionsResponse, OperationsBase } from "../../base/internal";
import { AuthorizationCallback, Changeset, EntityListIterator, HeaderFactories, HttpResponse, MinimalNamedVersion, NamedVersion, PreferReturn } from "../../base/types";
import { IModelsClient } from "../../IModelsClient";
import { OperationOptions } from "../OperationOptions";
import { getUser } from "../SharedFunctions";

import { CreateNamedVersionParams, GetNamedVersionListParams, GetSingleNamedVersionParams, NamedVersionPropertiesForCreate, NamedVersionPropertiesForUpdate, UpdateNamedVersionParams } from "./NamedVersionOperationParams";

export class NamedVersionOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
    private _iModelsClient: IModelsClient
  ) {
    super(options);
  }

  /**
   * Gets Named Versions of a specific iModel. This method returns Named Versions in their minimal representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-named-versions/ Get iModel Named Versions}
   * operation from iModels API.
   * @param {GetNamedVersionListParams} params parameters for this operation. See {@link GetNamedVersionListParams}.
   * @returns {EntityListIterator<MinimalNamedVersion>} iterator for Named Version list. See {@link EntityListIterator},
   * {@link MinimalNamedVersion}.
   */
  public getMinimalList(params: GetNamedVersionListParams): EntityListIterator<MinimalNamedVersion> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalNamedVersion, NamedVersionsResponse<MinimalNamedVersion>>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response) => response.data.namedVersions,
      headers: params.headers
    }));
  }

  /**
   * Gets Named Versions of a specific iModel. This method returns Named Versions in their full representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-named-versions/
   * Get iModel Named Versions} operation from iModels API.
   * @param {GetNamedVersionListParams} params parameters for this operation. See {@link GetNamedVersionListParams}.
   * @returns {EntityListIterator<NamedVersion>} iterator for Named Version list. See {@link EntityListIterator},
   * {@link NamedVersion}.
   */
  public getRepresentationList(params: GetNamedVersionListParams): EntityListIterator<NamedVersion> {
    const entityCollectionAccessor = (response: HttpResponse<NamedVersionsResponse<NamedVersion>>) => {
      const namedVersions = response.data.namedVersions;
      const mappedNamedVersions = namedVersions.map((namedVersion) => this.appendRelatedEntityCallbacks(params.authorization, namedVersion, params.headers));
      return mappedNamedVersions;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<NamedVersion, NamedVersionsResponse<NamedVersion>>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor,
      headers: params.headers
    }));
  }

  /**
   * Gets a single Named Version by its id. This method returns a Named Version in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-named-version-details/
   * Get iModel Named Version} operation from iModels API.
   * @param {GetSingleNamedVersionParams} params parameters for this operation. See {@link GetSingleNamedVersionParams}.
   * @returns {Promise<NamedVersion>} a Named Version with specified id. See {@link NamedVersion}.
   */
  public async getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendGetRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ iModelId: params.iModelId, namedVersionId: params.namedVersionId }),
      headers: params.headers
    });
    const result: NamedVersion = this.appendRelatedEntityCallbacks(params.authorization, response.data.namedVersion, params.headers);
    return result;
  }

  /**
   * Creates a Named Version with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel-named-version/
   * Create iModel Named Version} operation from iModels API.
   * @param {CreateNamedVersionParams} params parameters for this operation. See {@link CreateNamedVersionParams}.
   * @returns {Promise<NamedVersion>} newly created Named Version. See {@link NamedVersion}.
   */
  public async create(params: CreateNamedVersionParams): Promise<NamedVersion> {
    const createNamedVersionBody = this.getCreateNamedVersionRequestBody(params.namedVersionProperties);
    const createNamedVersionResponse = await this.sendPostRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId }),
      body: createNamedVersionBody,
      headers: params.headers
    });
    const result: NamedVersion = this.appendRelatedEntityCallbacks(params.authorization, createNamedVersionResponse.data.namedVersion, params.headers);
    return result;
  }

  /**
   * Updates Named Version with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/update-imodel-named-version/
   * Update iModel Named Version} operation from iModels API.
   * @param {UpdateNamedVersionParams} params parameters for this operation. See {@link UpdateNamedVersionParams}.
   * @returns {Promise<NamedVersion>} updated Named Version. See {@link NamedVersion}.
   */
  public async update(params: UpdateNamedVersionParams): Promise<NamedVersion> {
    const updateNamedVersionBody = this.getUpdateNamedVersionRequestBody(params.namedVersionProperties);
    const updateNamedVersionResponse = await this.sendPatchRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ iModelId: params.iModelId, namedVersionId: params.namedVersionId }),
      body: updateNamedVersionBody,
      headers: params.headers
    });
    const result: NamedVersion = this.appendRelatedEntityCallbacks(params.authorization, updateNamedVersionResponse.data.namedVersion, params.headers);
    return result;
  }

  private getCreateNamedVersionRequestBody(namedVersionProperties: NamedVersionPropertiesForCreate): object {
    return {
      name: namedVersionProperties.name,
      description: namedVersionProperties.description,
      changesetId: namedVersionProperties.changesetId
    };
  }

  private getUpdateNamedVersionRequestBody(namedVersionProperties: NamedVersionPropertiesForUpdate): object {
    return {
      name: namedVersionProperties.name,
      description: namedVersionProperties.description,
      state: namedVersionProperties.state
    };
  }

  protected appendRelatedEntityCallbacks(authorization: AuthorizationCallback, namedVersion: NamedVersion, headers?: HeaderFactories): NamedVersion {
    const getCreator = async () => getUser(
      authorization,
      this._iModelsClient.users,
      this._options.urlFormatter,
      namedVersion._links.creator?.href,
      headers
    );
    const getChangeset = async () => this.getChangeset(authorization, namedVersion._links.changeset?.href, headers);

    const result: NamedVersion = {
      ...namedVersion,
      getCreator,
      getChangeset
    };

    return result;
  }

  private async getChangeset(authorization: AuthorizationCallback, changesetLink: string | undefined, headers?: HeaderFactories): Promise<Changeset | undefined> {
    if (!changesetLink)
      return undefined;

    const entityIds = this._options.urlFormatter.parseChangesetUrl(changesetLink);
    return this._iModelsClient.changesets.getSingle({
      authorization,
      ...entityIds,
      headers
    });
  }
}
