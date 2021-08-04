/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse, EntityCollectionPage, PreferReturn, } from "../InternalModels";
import { OperationsBase } from "../OperationsBase";
import { pagedCollectionGenerator } from "../PagedCollectionGenerator";
import { RequestContextParam } from "../PublicModels";
import { RESTClient } from "../RESTClient";
import { MinimaliModel, iModel } from "./iModelModels";
import { CreateEmptyiModelParams, DeleteiModelParams, GetiModelByIdParams, GetiModelListParams } from "./iModelOperationParams";

interface iModelResponse {
  iModel: iModel;
}

interface iModelsResponse<TiModel> extends CollectionResponse {
  iModels: TiModel[];
}

export class iModelOperations extends OperationsBase {
  constructor(restClient: RESTClient) {
    super(restClient);
  }

  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return pagedCollectionGenerator(() => this.getEntityCollectionPage<MinimaliModel>({
      ...params,
      url: `${this._baseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal
    }));
  }

  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return pagedCollectionGenerator(() => this.getEntityCollectionPage<iModel>({
      ...params,
      url: `${this._baseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation
    }));
  }

  public async getById(params: GetiModelByIdParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      ...params,
      url: `${this._baseUrl}/${params.imodelId}`
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const response = await this.sendPostRequest<iModelResponse>({
      ...params,
      url: this._baseUrl,
      body: params.imodelProperties
    });
    return response.iModel;
  }

  public delete(params: DeleteiModelParams): Promise<void> {
    return this.sendDeleteRequest({
      ...params,
      url: `${this._baseUrl}/${params.imodelId}`
    });
  }

  private async getEntityCollectionPage<TiModel>(params: RequestContextParam & { url: string, preferReturn: PreferReturn }): Promise<EntityCollectionPage<TiModel>> {
    const response = await this.sendGetRequest<iModelsResponse<TiModel>>(params);
    return {
      entities: response.iModels,
      next: response._links.next
        ? () => this.getEntityCollectionPage({ requestContext: params.requestContext, url: response._links.next.href, preferReturn: params.preferReturn })
        : undefined
    };
  }
}
