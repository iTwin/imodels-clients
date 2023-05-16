/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../../Constants";
import { AuthorizationParam, BinaryContentType, ContentType, Dictionary, HeadersFactories, HeadersParam, PreferReturn, RestClient, SupportedGetResponseTypes } from "../types";

import { CollectionResponse } from "./ApiResponseInterfaces";
import { EntityCollectionPage } from "./UtilityTypes";

type SendGetRequestParams = AuthorizationParam & HeadersParam & { url: string, preferReturn?: PreferReturn, responseType?: SupportedGetResponseTypes };
type SendPostRequestParams = AuthorizationParam & HeadersParam & { url: string, body: object | undefined };
type SendPutRequestParams = AuthorizationParam & HeadersParam & { url: string, contentType: BinaryContentType, body: Uint8Array };
type SendPatchRequestParams = SendPostRequestParams;
type SendDeleteRequestParams = AuthorizationParam & HeadersParam & { url: string };

export interface OperationsBaseOptions {
  restClient: RestClient;
  api: { version: string };
  headersFactories?: HeadersFactories;
}

export class OperationsBase<TOptions extends OperationsBaseOptions> {
  constructor(protected _options: TOptions) {
  }

  protected async sendGetRequest<TResponse>(params: SendGetRequestParams & { responseType?: ContentType.Json }): Promise<TResponse>;
  protected async sendGetRequest(params: SendGetRequestParams & { responseType: ContentType.Png }): Promise<Uint8Array>;
  protected async sendGetRequest<TResponse>(params: SendGetRequestParams): Promise<TResponse | Uint8Array> {
    const urlAndHeaders = {
      url: params.url,
      headers: await this.formHeaders(params)
    };

    if (params.responseType === ContentType.Png)
      return this._options.restClient.sendGetRequest({
        responseType: ContentType.Png,
        ...urlAndHeaders
      });

    return this._options.restClient.sendGetRequest<TResponse>({
      responseType: params.responseType ?? ContentType.Json,
      ...urlAndHeaders
    });
  }

  protected async sendPostRequest<TResponse>(params: SendPostRequestParams): Promise<TResponse> {
    return this._options.restClient.sendPostRequest<TResponse>({
      url: params.url,
      body: {
        contentType: ContentType.Json,
        content: params.body
      },
      headers: await this.formHeaders({ ...params, contentType: ContentType.Json })
    });
  }

  protected async sendPutRequest<TResponse>(params: SendPutRequestParams): Promise<TResponse> {
    return this._options.restClient.sendPutRequest<TResponse>({
      url: params.url,
      body: {
        contentType: params.contentType,
        content: params.body
      },
      headers: await this.formHeaders({ ...params, contentType: params.contentType })
    });
  }

  protected async sendPatchRequest<TResponse>(params: SendPatchRequestParams): Promise<TResponse> {
    return this._options.restClient.sendPatchRequest<TResponse>({
      url: params.url,
      body: {
        contentType: ContentType.Json,
        content: params.body
      },
      headers: await this.formHeaders({ ...params, contentType: ContentType.Json })
    });
  }

  protected async sendDeleteRequest<TResponse>(params: SendDeleteRequestParams): Promise<TResponse> {
    return this._options.restClient.sendDeleteRequest<TResponse>({
      url: params.url,
      headers: await this.formHeaders(params)
    });
  }

  protected async getEntityCollectionPage<TEntity>(params: AuthorizationParam & HeadersParam & {
    url: string;
    preferReturn?: PreferReturn;
    entityCollectionAccessor: (response: unknown) => TEntity[];
  }): Promise<EntityCollectionPage<TEntity>> {
    const response = await this.sendGetRequest<CollectionResponse>(params);
    return {
      entities: params.entityCollectionAccessor(response),
      next: response._links.next
        ? async () => this.getEntityCollectionPage({ ...params, url: response._links.next!.href })
        : undefined
    };
  }

  private addHeaders(headers: Dictionary<string>, headersFactories?: HeadersFactories) {
    if (!headersFactories)
      return;

    for (const headerName in headersFactories) {
      if(Object.prototype.hasOwnProperty.call(headersFactories, headerName)) {
        const value = headersFactories[headerName]();
        if (typeof value === "string")
          headers[headerName] = value;
      }
    }
  }

  private async formHeaders(params: AuthorizationParam & HeadersParam & { preferReturn?: PreferReturn, contentType?: ContentType}): Promise<Dictionary<string>> {
    const headers: Dictionary<string> = {};
    const authorizationInfo = await params.authorization();
    headers[Constants.headers.authorization] = `${authorizationInfo.scheme} ${authorizationInfo.token}`;
    headers[Constants.headers.accept] = `application/vnd.bentley.${this._options.api.version}+json`;

    if (params.preferReturn)
      headers[Constants.headers.prefer] = `return=${params.preferReturn}`;

    if (params.contentType)
      headers[Constants.headers.contentType] = params.contentType;

    this.addHeaders(headers, this._options.headersFactories);
    this.addHeaders(headers, params.headersFactories);

    return headers;
  }
}
