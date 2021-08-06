/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse, EntityCollectionPage, PreferReturn, } from "../../InternalCommonInterfaces";
import { OperationsBase } from "../../OperationsBase";
import { getPagedCollectionGenerator } from "../../PagedCollectionGenerator";
import { RequestContextParam } from "../../PublicCommonInterfaces";
import { RestClient } from "../../RESTClient";
import { MinimaliModel, iModel } from "./iModelInterfaces";
import { CreateEmptyiModelParams, DeleteiModelParams, GetiModelByIdParams, GetiModelListParams } from "./iModelOperationParams";

export interface iModelResponse {
  iModel: iModel;
}

export interface iModelsResponse<TiModel> extends CollectionResponse {
  iModels: TiModel[];
}

export class iModelOperations extends OperationsBase {
  constructor(restClient: RestClient) {
    super(restClient);
  }

  public getMinimalList(params: GetiModelListParams): AsyncIterableIterator<MinimaliModel> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<MinimaliModel>({
      ...params,
      url: `${this._apiBaseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal
    }));
  }

  public getRepresentationList(params: GetiModelListParams): AsyncIterableIterator<iModel> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<iModel>({
      ...params,
      url: `${this._apiBaseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation
    }));
  }

  public async getById(params: GetiModelByIdParams): Promise<iModel> {
    const response = await this.sendGetRequest<iModelResponse>({
      ...params,
      url: `${this._apiBaseUrl}/${params.imodelId}`
    });
    return response.iModel;
  }

  public async createEmpty(params: CreateEmptyiModelParams): Promise<iModel> {
    const response = await this.sendPostRequest<iModelResponse>({
      ...params,
      url: this._apiBaseUrl,
      body: params.imodelProperties
    });
    return response.iModel;
  }

  public delete(params: DeleteiModelParams): Promise<void> {
    return this.sendDeleteRequest({
      ...params,
      url: `${this._apiBaseUrl}/${params.imodelId}`
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
