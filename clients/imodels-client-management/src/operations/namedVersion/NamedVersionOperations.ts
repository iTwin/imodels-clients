/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimalNamedVersion, NamedVersion, NamedVersionResponse, NamedVersionsResponse, OperationsBase, PreferReturn, getCollectionIterator } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateNamedVersionParams, GetNamedVersionListParams, GetSingleNamedVersionParams, UpdateNamedVersionParams } from "./NamedVersionOperationParams";

export class NamedVersionOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getMinimalList(params: GetNamedVersionListParams): AsyncIterableIterator<MinimalNamedVersion> {
    return getCollectionIterator(() => this.getEntityCollectionPage<MinimalNamedVersion>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ imodelId: params.imodelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as NamedVersionsResponse<MinimalNamedVersion>).namedVersions
    }));
  }

  public getRepresentationList(params: GetNamedVersionListParams): AsyncIterableIterator<NamedVersion> {
    return getCollectionIterator(() => this.getEntityCollectionPage<NamedVersion>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ imodelId: params.imodelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as NamedVersionsResponse<NamedVersion>).namedVersions
    }));
  }

  public async getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendGetRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ imodelId: params.imodelId, namedVersionId: params.namedVersionId }),
    });
    return response.namedVersion;
  }

  public async create(params: CreateNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendPostRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ imodelId: params.imodelId }),
      body: params.namedVersionProperties
    });
    return response.namedVersion;
  }

  public async update(params: UpdateNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendPatchRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ imodelId: params.imodelId, namedVersionId: params.namedVersionId }),
      body: params.namedVersionProperties
    });
    return response.namedVersion;
  }
}
