/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../../Constants";
import { AuthorizationParam, BinaryContentType, ContentType, Dictionary, HeaderFactories, HeadersParam, HttpResponse, PreferReturn, RestClient, SupportedGetResponseTypes } from "../types";

import { CollectionResponse } from "./ApiResponseInterfaces";
import { EntityCollectionPage } from "./UtilityTypes";

type CommonRequestParams = AuthorizationParam & HeadersParam;
export type SendGetRequestParams = CommonRequestParams & { url: string, preferReturn?: PreferReturn, responseType?: SupportedGetResponseTypes };
export type SendPostRequestParams = CommonRequestParams & { url: string, body: object | undefined };
export type SendPutRequestParams = CommonRequestParams & { url: string, contentType: BinaryContentType, body: Uint8Array };
export type SendPatchRequestParams = SendPostRequestParams;
export type SendDeleteRequestParams = CommonRequestParams & { url: string };
export interface OperationsBaseOptions {
  restClient: RestClient;
  api: { version: string };
  headers: HeaderFactories;
}

export class OperationsBase<TOptions extends OperationsBaseOptions> {
  constructor(protected _options: TOptions) {
  }

  protected async sendGetRequest<TData>(params: SendGetRequestParams & { responseType?: ContentType.Json }): Promise<HttpResponse<TData>>;
  protected async sendGetRequest(params: SendGetRequestParams & { responseType: ContentType.Png }): Promise<HttpResponse<Uint8Array>>;
  protected async sendGetRequest<TData>(params: SendGetRequestParams): Promise<HttpResponse<TData | Uint8Array>> {
    const urlAndHeaders = {
      url: params.url,
      headers: await this.formHeaders(params)
    };

    if (params.responseType === ContentType.Png)
      return this._options.restClient.sendGetRequest({
        responseType: ContentType.Png,
        ...urlAndHeaders
      });

    return this._options.restClient.sendGetRequest<TData>({
      responseType: params.responseType ?? ContentType.Json,
      ...urlAndHeaders
    });
  }

  protected async sendPostRequest<TData>(params: SendPostRequestParams): Promise<HttpResponse<TData>> {
    return this._options.restClient.sendPostRequest<TData>({
      url: params.url,
      body: {
        contentType: ContentType.Json,
        content: params.body
      },
      headers: await this.formHeaders({ ...params, contentType: ContentType.Json })
    });
  }

  protected async sendPutRequest<TData>(params: SendPutRequestParams): Promise<HttpResponse<TData>> {
    return this._options.restClient.sendPutRequest<TData>({
      url: params.url,
      body: {
        contentType: params.contentType,
        content: params.body
      },
      headers: await this.formHeaders({ ...params, contentType: params.contentType })
    });
  }

  protected async sendPatchRequest<TData>(params: SendPatchRequestParams): Promise<HttpResponse<TData>> {
    return this._options.restClient.sendPatchRequest<TData>({
      url: params.url,
      body: {
        contentType: ContentType.Json,
        content: params.body
      },
      headers: await this.formHeaders({ ...params, contentType: ContentType.Json })
    });
  }

  protected async sendDeleteRequest<TData>(params: SendDeleteRequestParams): Promise<HttpResponse<TData>> {
    return this._options.restClient.sendDeleteRequest<TData>({
      url: params.url,
      headers: await this.formHeaders(params)
    });
  }

  protected async getEntityCollectionPage<TEntity, TResponse extends CollectionResponse>(params: CommonRequestParams & {
    url: string;
    preferReturn?: PreferReturn;
    entityCollectionAccessor: (response: HttpResponse<TResponse>) => TEntity[];
  }): Promise<EntityCollectionPage<TEntity>> {
    const response = await this.sendGetRequest<TResponse>(params);
    return {
      entities: params.entityCollectionAccessor(response),
      next: response.data._links.next
        ? async () => this.getEntityCollectionPage({ ...params, url: response.data._links.next!.href })
        : undefined
    };
  }

  private resolveHeaderValue(headerOrHeaderFactory: (() => string | undefined) | string): string | undefined {
    if (typeof headerOrHeaderFactory === "function")
      return headerOrHeaderFactory();
    return headerOrHeaderFactory;
  }

  private addOrUpdateHeaders(existingHeaders: Dictionary<string>, additionalHeaders?: HeaderFactories) {
    if (!additionalHeaders)
      return;

    for (const headerName in additionalHeaders) {
      if (Object.prototype.hasOwnProperty.call(additionalHeaders, headerName)) {
        const headerValue: string | undefined = this.resolveHeaderValue(additionalHeaders[headerName]);
        if (typeof headerValue === "string")
          existingHeaders[headerName] = headerValue;
        else
          delete existingHeaders[headerName];
      }
    }
  }

  private async formHeaders(params: CommonRequestParams & { preferReturn?: PreferReturn, contentType?: ContentType}): Promise<Dictionary<string>> {
    const headers: Dictionary<string> = {};
    const authorizationInfo = await params.authorization();
    headers[Constants.headers.authorization] = `${authorizationInfo.scheme} ${authorizationInfo.token}`;
    headers[Constants.headers.accept] = `application/vnd.bentley.${this._options.api.version}+json`;

    if (params.preferReturn)
      headers[Constants.headers.prefer] = `return=${params.preferReturn}`;

    if (params.contentType)
      headers[Constants.headers.contentType] = params.contentType;

    this.addOrUpdateHeaders(headers, this._options.headers);
    this.addOrUpdateHeaders(headers, params.headers);

    return headers;
  }
}
