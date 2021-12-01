/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimaliModel, OperationsBase, PreferReturn, getCollectionIterator, iModel, iModelResponse, iModelsResponse } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyiModelParams, DeleteiModelParams, GetSingleiModelParams, GetiModelListParams, iModelProperties } from "./iModelOperationParams";

export class iModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets iModels for a specific project. This method returns iModels in their minimal representation. The returned iterator internally queries entities in pages.
   * Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels} operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {AsyncIterableIterator<MinimaliModel>} iterator for iModels collection. See {@link MinimaliModel}.
   */
  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<MinimaliModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getiModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as iModelsResponse<MinimaliModel>).iModels
    }));
  }

  /**
   * Gets iModels for a specific project. This method returns iModels in their full representation. The returned iterator internally queries entities in pages.
   * Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels} operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {AsyncIterableIterator<iModel>} iterator for iModels collection. See {@link iModel}.
   */
  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<iModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getiModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as iModelsResponse<iModel>).iModels
    }));
  }

  /**
   * Gets a single iModel by id. This method returns an iModel in its full representation.
   * Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-details/ Get iModel} operation from iModels API.
   * @param {GetSingleiModelParams} params parameters for this operation. See {@link GetSingleiModelParams}.
   * @returns {Promise<iModel>} an iModel with specified id. See {@link iModel}.
   */
  public async getSingle(params: GetSingleiModelParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleiModelUrl({ imodelId: params.imodelId })
    });
    return response.iModel;
  }
  
  /**
   * Creates an empty iModel with specified properties.
   * Wraps the {@link https://developer.bentley.com/apis/imodels/operations/create-imodel/ Create iModel} operation from iModels API.
   * @param {CreateEmptyiModelParams} params parameters for this operation. See {@link CreateEmptyiModelParams}.
   * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
   */
  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const createiModelBody = this.getCreateEmptyiModelRequestBody(params.imodelProperties);
    const createiModelResponse = await this.sendPostRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCreateiModelUrl(),
      body: createiModelBody
    });
    return createiModelResponse.iModel;
  }

  /**
   * Deletes an iModel with specified id.
   * Wraps the {@link https://developer.bentley.com/apis/imodels/operations/delete-imodel/ Delete iModel} operation from iModels API.
   * @param {DeleteiModelParams} params parameters for this operation. See {@link DeleteiModelParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async delete(params: DeleteiModelParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleiModelUrl({ imodelId: params.imodelId })
    });
  }

  protected getCreateEmptyiModelRequestBody(imodelProperties: iModelProperties): object {
    return {
      projectId: imodelProperties.projectId,
      name: imodelProperties.name,
      description: imodelProperties.description,
      extent: imodelProperties.extent
    };
  }
}
