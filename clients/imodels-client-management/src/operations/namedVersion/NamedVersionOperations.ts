/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimalNamedVersion, NamedVersion, NamedVersionResponse, NamedVersionsResponse, OperationsBase, PreferReturn, getPagedCollectionGenerator } from "../../base";
import { CreateNamedVersionParams, GetNamedVersionByIdParams, GetNamedVersionListParams, UpdateNamedVersionParams } from "./NamedVersionOperationParams";

export class NamedVersionOperations extends OperationsBase {
  public getMinimalList(params: GetNamedVersionListParams): AsyncIterableIterator<MinimalNamedVersion> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<MinimalNamedVersion>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/namedversions${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: NamedVersionsResponse<MinimalNamedVersion>) => response.namedVersions
    }));
  }

  public getRepresentationList(params: GetNamedVersionListParams): AsyncIterableIterator<NamedVersion> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<NamedVersion>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/namedversions${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: NamedVersionsResponse<NamedVersion>) => response.namedVersions
    }));
  }

  public async getById(params: GetNamedVersionByIdParams): Promise<NamedVersion> {
    const response = await this.sendGetRequest<NamedVersionResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/namedversions/${params.namedVersionId}`
    });
    return response.namedVersion;
  }

  public async create(params: CreateNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendPostRequest<NamedVersionResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/namedversions`,
      body: params.namedVersionProperties
    });
    return response.namedVersion;
  }

  public async update(params: UpdateNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendPatchRequest<NamedVersionResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/namedversions/${params.namedVersionId}`,
      body: params.namedVersionProperties
    });
    return response.namedVersion;
  }
}

