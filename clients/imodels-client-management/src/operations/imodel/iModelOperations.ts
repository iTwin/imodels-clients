/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, getPagedCollectionGenerator, iModel, iModelResponse, iModelsResponse, MinimaliModel, PreferReturn } from "../../base";
import { CreateEmptyiModelParams, DeleteiModelParams, GetiModelByIdParams, GetiModelListParams } from "./iModelOperationParams";

export class iModelOperations extends OperationsBase {
  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<MinimaliModel>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: iModelsResponse<MinimaliModel>) => response.iModels
    }));
  }

  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<iModel>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: iModelsResponse<iModel>) => response.iModels
    }));
  }

  public async getById(params: GetiModelByIdParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}`
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const response = await this.sendPostRequest<iModelResponse>({
      requestContext: params.requestContext,
      url: this._apiBaseUrl,
      body: params.imodelProperties
    });
    return response.iModel;
  }

  public delete(params: DeleteiModelParams): Promise<void> {
    return this.sendDeleteRequest({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}`
    });
  }
}
