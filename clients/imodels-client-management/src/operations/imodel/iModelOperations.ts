/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase, RequestContextParam, EntityCollectionPage, RecursiveRequired, getPagedCollectionGenerator, iModel, iModelResponse, iModelsResponse, MinimaliModel, PreferReturn } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateEmptyiModelParams, DeleteiModelParams, GetiModelByIdParams, GetiModelListParams } from "./iModelOperationParams";

export class iModelOperations extends OperationsBase {
  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    super(options);
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
