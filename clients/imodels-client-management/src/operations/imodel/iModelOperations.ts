/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimaliModel, OperationsBase, PreferReturn, getCollectionIterator, iModel, iModelResponse, iModelsResponse } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyiModelParams, DeleteiModelParams, GetSingleiModelParams, GetiModelListParams } from "./iModelOperationParams";

export class iModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<MinimaliModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getiModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as iModelsResponse<MinimaliModel>).iModels
    }));
  }

  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<iModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getiModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as iModelsResponse<iModel>).iModels
    }));
  }

  public async getSingle(params: GetSingleiModelParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleiModelUrl({ imodelId: params.imodelId }),
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const response = await this.sendPostRequest<iModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCreateiModelUrl(),
      body: params.imodelProperties
    });
    return response.iModel;
  }

  public async delete(params: DeleteiModelParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleiModelUrl({ imodelId: params.imodelId }),
    });
  }
}
