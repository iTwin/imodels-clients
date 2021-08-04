/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseOperations } from "../iModelsRestClient";
import { EntityCollectionPage, PreferReturn, iModelResponse, iModelsResponse } from "../InternalModels";
import { pagedCollectionGenerator } from "../PagedCollectionGenerator";
import { RequestContextParam } from "../PublicModels";
import { RESTClient } from "../RESTClient";
import { MinimaliModel, iModel } from "./iModelModels";
import { CreateEmptyiModelParams, DeleteiModelParams, GetiModelByIdParams, GetiModelListParams } from "./iModelOperationParams";

export class iModelOperations extends BaseOperations {
  private _baseUrl = "https://sbx-api.bentley.com/imodels";
  private _restClient: RESTClient;

  constructor(restClient: RESTClient) {
    super();
    this._restClient = restClient;
  }

  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return pagedCollectionGenerator(() => this.getList<MinimaliModel>({
      requestContext: params.requestContext,
      url: `${this._baseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal
    }));
  }

  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return pagedCollectionGenerator(() => this.getList<iModel>({
      requestContext: params.requestContext,
      url: `${this._baseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation
    }));
  }

  public async getById(params: GetiModelByIdParams): Promise<iModel> {
    const response = await this._restClient.sendGetRequest<iModelResponse>({
      url: `${this._baseUrl} /${params.imodelId}`,
      headers: this.getHeaders(params)
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const response = await this._restClient.sendPostRequest<iModelResponse>({
      url: this._baseUrl,
      body: params.imodelProperties,
      headers: this.getHeaders(params)
    });
    return response.iModel;
  }

  public delete(params: DeleteiModelParams): Promise<void> {
    return this._restClient.sendDeleteRequest({
      url: `${this._baseUrl}/${params.imodelId}`,
      headers: this.getHeaders(params)
    });
  }

  private async getList<TiModel>(params: RequestContextParam & { url: string, preferReturn: PreferReturn }): Promise<EntityCollectionPage<TiModel>> {
    const response = await this._restClient.sendGetRequest<iModelsResponse<TiModel>>({
      url: params.url,
      headers: this.getHeaders(params)
    });
    return {
      entities: response.iModels,
      next: response._links.next
        ? () => this.getList({ requestContext: params.requestContext, url: response._links.next.href, preferReturn: params.preferReturn })
        : undefined
    };
  }
}