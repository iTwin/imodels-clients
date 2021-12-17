/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModel, IModelResponse, IModelsResponse, MinimalIModel, OperationsBase, PreferReturn, EntityListIteratorImpl, EntityListIterator } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyIModelParams, DeleteIModelParams, GetIModelListParams, GetSingleIModelParams, IModelProperties } from "./IModelOperationParams";

export class IModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets iModels for a specific project. This method returns iModels in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels}
   * operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {AsyncIterableIterator<MinimaliModel>} iterator for iModels collection. See {@link MinimaliModel}.
   */
  public getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalIModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<MinimalIModel>).iModels
    }));
  }

  /**
   * Gets iModels for a specific project. This method returns iModels in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels}
   * operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {AsyncIterableIterator<iModel>} iterator for iModels collection. See {@link iModel}.
   */
  public getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<IModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<IModel>).iModels
    }));
  }

  /**
   * Gets a single iModel by id. This method returns an iModel in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-details/ Get iModel} operation from iModels API.
   * @param {GetSingleiModelParams} params parameters for this operation. See {@link GetSingleiModelParams}.
   * @returns {Promise<iModel>} an iModel with specified id. See {@link iModel}.
   */
  public async getSingle(params: GetSingleIModelParams): Promise<IModel> {
    const response = await this.sendGetRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId })
    });
    return response.iModel;
  }

  /**
   * Creates an empty iModel with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/create-imodel/ Create iModel} operation from iModels API.
   * @param {CreateEmptyiModelParams} params parameters for this operation. See {@link CreateEmptyiModelParams}.
   * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
   */
  public async createEmpty(params: CreateEmptyIModelParams): Promise<IModel> {
    const createIModelBody = this.getCreateEmptyIModelRequestBody(params.iModelProperties);
    const createIModelResponse = await this.sendPostRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCreateIModelUrl(),
      body: createIModelBody
    });
    return createIModelResponse.iModel;
  }

  /**
   * Deletes an iModel with specified id. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/delete-imodel/ Delete iModel}
   * operation from iModels API.
   * @param {DeleteiModelParams} params parameters for this operation. See {@link DeleteiModelParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async delete(params: DeleteIModelParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId })
    });
  }

  protected getCreateEmptyIModelRequestBody(iModelProperties: IModelProperties): object {
    return {
      projectId: iModelProperties.projectId,
      name: iModelProperties.name,
      description: iModelProperties.description,
      extent: iModelProperties.extent
    };
  }
}
