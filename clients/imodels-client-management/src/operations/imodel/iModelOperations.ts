/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimaliModel, OperationsBase, PreferReturn, getCollectionIterator, iModel, iModelResponse, iModelsResponse } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyiModelParams, DeleteiModelParams, GetSingleiModelParams, GetiModelListParams } from "./iModelOperationParams";

export class iModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return getCollectionIterator(() => this.getSingleCollectionPage<MinimaliModel>({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}${this.formQueryString({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as iModelsResponse<MinimaliModel>).iModels
    }));
  }

  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return getCollectionIterator(() => this.getSingleCollectionPage<iModel>({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}${this.formQueryString({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as iModelsResponse<iModel>).iModels
    }));
  }

  public async getSingle(params: GetSingleiModelParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}/${params.imodelId}`
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const response = await this.sendPostRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.baseUri,
      body: params.imodelProperties
    });
    return response.iModel;
  }

  public delete(params: DeleteiModelParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}/${params.imodelId}`
    });
  }
}
