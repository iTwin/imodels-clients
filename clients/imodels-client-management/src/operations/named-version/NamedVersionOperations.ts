/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { MinimalNamedVersion, NamedVersion, NamedVersionResponse, NamedVersionsResponse, OperationsBase, PreferReturn, getCollectionIterator } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateNamedVersionParams, GetNamedVersionListParams, GetSingleNamedVersionParams, NamedVersionPropertiesForCreate, NamedVersionPropertiesForUpdate, UpdateNamedVersionParams } from "./NamedVersionOperationParams";

export class NamedVersionOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getMinimalList(params: GetNamedVersionListParams): AsyncIterableIterator<MinimalNamedVersion> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<MinimalNamedVersion>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as NamedVersionsResponse<MinimalNamedVersion>).namedVersions
    }));
  }

  public getRepresentationList(params: GetNamedVersionListParams): AsyncIterableIterator<NamedVersion> {
    return getCollectionIterator(async () => this.getEntityCollectionPage<NamedVersion>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as NamedVersionsResponse<NamedVersion>).namedVersions
    }));
  }

  public async getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion> {
    const response = await this.sendGetRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ iModelId: params.iModelId, namedVersionId: params.namedVersionId })
    });
    return response.namedVersion;
  }

  public async create(params: CreateNamedVersionParams): Promise<NamedVersion> {
    const createNamedVersionBody = this.getCreateNamedVersionRequestBody(params.namedVersionProperties);
    const createNamedVersionResponse = await this.sendPostRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getNamedVersionListUrl({ iModelId: params.iModelId }),
      body: createNamedVersionBody
    });
    return createNamedVersionResponse.namedVersion;
  }

  public async update(params: UpdateNamedVersionParams): Promise<NamedVersion> {
    const updateNamedVersionBody = this.getUpdateNamedVersionRequestBody(params.namedVersionProperties);
    const updateNamedVersionResponse = await this.sendPatchRequest<NamedVersionResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleNamedVersionUrl({ iModelId: params.iModelId, namedVersionId: params.namedVersionId }),
      body: updateNamedVersionBody
    });
    return updateNamedVersionResponse.namedVersion;
  }

  private getCreateNamedVersionRequestBody(namedVersionProperties: NamedVersionPropertiesForCreate): object {
    return {
      name: namedVersionProperties.name,
      description: namedVersionProperties.description,
      changesetId: namedVersionProperties.changesetId
    };
  }

  private getUpdateNamedVersionRequestBody(namedVersionProperties: NamedVersionPropertiesForUpdate): object {
    return {
      name: namedVersionProperties.name,
      description: namedVersionProperties.description,
      state: namedVersionProperties.state
    };
  }
}
