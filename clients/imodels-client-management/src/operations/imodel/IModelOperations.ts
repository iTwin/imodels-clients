/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModel, IModelResponse, IModelsResponse, MinimalIModel, OperationsBase, PreferReturn, getCollectionIterator } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyIModelParams, DeleteIModelParams, GetIModelListParams, GetSingleIModelParams, IModelProperties } from "./IModelOperationParams";

export class IModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getMinimalList(params: GetIModelListParams): AsyncIterableIterator<MinimalIModel> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<MinimalIModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<MinimalIModel>).iModels
    }));
  }

  public getRepresentationList(params: GetIModelListParams): AsyncIterableIterator<IModel> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<IModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<IModel>).iModels
    }));
  }

  public async getSingle(params: GetSingleIModelParams): Promise<IModel> {
    const response = await this.sendGetRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId })
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyIModelParams): Promise<IModel> {
    const createIModelBody = this.getCreateEmptyIModelRequestBody(params.iModelProperties);
    const createIModelResponse = await this.sendPostRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCreateIModelUrl(),
      body: createIModelBody
    });
    return createIModelResponse.iModel;
  }

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
