/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimaliModel, OperationsBase, PreferReturn, getCollectionIterator, iModel, iModelResponse, iModelsResponse } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyiModelParams, DeleteiModelParams, GetSingleiModelParams, GetiModelListParams, iModelProperties } from "./iModelOperationParams";

export class iModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets iModels for a specific project. This method returns iModels in their minimal representation. The returned iterator utilises API pagination to query entities in pages.
   * @param {GetiModelListParams} params - parameters for this operation. See {@link GetiModelListParams} documentation for details on specific properties.
   * @returns {AsyncIterableIterator<MinimaliModel>} - iterator for iModels collection.
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
   * Gets iModels for a specific project. This method returns iModels in their full representation. The returned iterator utilises API pagination to query entities in pages.
   * @param {GetiModelListParams} params - parameters for this operation. @see GetiModelListParams documentation for details on specific properties.
   * @returns {AsyncIterableIterator<iModel>} - iterator for iModels collection.
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
   * Gets a single iModel by id.
   * @param {GetSingleiModelParams} params - parameters for this operation. @see GetSingleiModelParams documentation for details on specific properties.
   * @returns {Promise<iModel>} - an iModel with specified id.
   * @throws {iModelsError} with code {iModelsErrorCode.iModelNotFound} if iModel with specified id does not exist.
   */
  public async getSingle(params: GetSingleiModelParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleiModelUrl({ imodelId: params.imodelId })
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const createiModelBody = this.getCreateEmptyiModelRequestBody(params.imodelProperties);
    const createiModelResponse = await this.sendPostRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCreateiModelUrl(),
      body: createiModelBody
    });
    return createiModelResponse.iModel;
  }

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
