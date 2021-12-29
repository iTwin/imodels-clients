/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIterator, EntityListIteratorImpl, MinimalNamedVersion, NamedVersion, NamedVersionResponse, NamedVersionsResponse, OperationsBase, PreferReturn } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateNamedVersionParams, GetNamedVersionListParams, GetSingleNamedVersionParams, NamedVersionPropertiesForCreate, NamedVersionPropertiesForUpdate, UpdateNamedVersionParams } from "./NamedVersionOperationParams";

export class NamedVersionOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets Named Versions of a specific iModel. This method returns Named Versions in their minimal representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-named-versions/ Get iModel Named Versions}
   * operation from iModels API.
   * @param {GetNamedVersionListParams} params parameters for this operation. See {@link GetNamedVersionListParams}.
   * @returns {EntityListIterator<MinimalNamedVersion>} iterator for Named Version list. See {@link EntityListIterator},
   * {@link MinimalNamedVersion}.
   */
  public getMinimalList(params: GetNamedVersionListParams): EntityListIterator<MinimalNamedVersion> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalNamedVersion>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as NamedVersionsResponse<MinimalNamedVersion>).namedVersions
    }));
  }

  /**
   * Gets Named Versions of a specific iModel. This method returns Named Versions in their full representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-named-versions/
   * Get iModel Named Versions} operation from iModels API.
   * @param {GetNamedVersionListParams} params parameters for this operation. See {@link GetNamedVersionListParams}.
   * @returns {EntityListIterator<NamedVersion>} iterator for Named Version list. See {@link EntityListIterator},
   * {@link NamedVersion}.
   */
  public getRepresentationList(params: GetNamedVersionListParams): EntityListIterator<NamedVersion> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<NamedVersion>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as NamedVersionsResponse<NamedVersion>).namedVersions
    }));
  }

  /**
   * Gets a single Named Version by its id. This method returns a Named Version in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-named-version-details/
   * Get iModel Named Version} operation from iModels API.
   * @param {GetSingleNamedVersionParams} params parameters for this operation. See {@link GetSingleNamedVersionParams}.
   * @returns {Promise<NamedVersion>} a Named Version with specified id. See {@link NamedVersion}.
   */
  public async getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendGetRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ iModelId: params.iModelId, namedVersionId: params.namedVersionId })
    });
    return response.namedVersion;
  }

  /**
   * Creates a Named Version with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/create-imodel-named-version/
   * Create iModel Named Version} operation from iModels API.
   * @param {CreateNamedVersionParams} params parameters for this operation. See {@link CreateNamedVersionParams}.
   * @returns {Promise<NamedVersion>} newly created Named Version. See {@link NamedVersion}.
   */
  public async create(params: CreateNamedVersionParams): Promise<NamedVersion> {
    const createNamedVersionBody = this.getCreateNamedVersionRequestBody(params.namedVersionProperties);
    const createNamedVersionResponse = await this.sendPostRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId }),
      body: createNamedVersionBody
    });
    return createNamedVersionResponse.namedVersion;
  }

  /**
   * Updates Named Version with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/update-imodel-named-version/
   * Update iModel Named Version} operation from iModels API.
   * @param {UpdateNamedVersionParams} params parameters for this operation. See {@link UpdateNamedVersionParams}.
   * @returns {Promise<NamedVersion>} updated Named Version. See {@link NamedVersion}.
   */
  public async update(params: UpdateNamedVersionParams): Promise<NamedVersion> {
    const updateNamedVersionBody = this.getUpdateNamedVersionRequestBody(params.namedVersionProperties);
    const updateNamedVersionResponse = await this.sendPatchRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ iModelId: params.iModelId, namedVersionId: params.namedVersionId }),
      body: updateNamedVersionBody
    });
    return updateNamedVersionResponse.namedVersion;
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
}
