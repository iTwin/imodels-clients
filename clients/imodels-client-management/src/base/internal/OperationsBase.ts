/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../../Constants";
import { AuthorizationParam, BinaryContentType, ContentType, Dictionary, HeaderFactories, HeadersParam, HttpResponse, IModelsOriginalError, PreferReturn, RestClient, SupportedGetResponseTypes } from "../types";

import { CollectionResponse } from "./ApiResponseInterfaces";
import { IModelsErrorBaseImpl, ResponseInfo } from "./IModelsErrorParser";
import { EntityCollectionPage } from "./UtilityTypes";

type CommonRequestParams = AuthorizationParam & HeadersParam;
export type ParseErrorFunc = (response: ResponseInfo, originalError: IModelsOriginalError) => Error;
export type SendGetRequestParams = CommonRequestParams & { url: string, preferReturn?: PreferReturn, responseType?: SupportedGetResponseTypes };
export type SendPostRequestParams = CommonRequestParams & { url: string, body: object | undefined };
export type SendPutRequestParams = CommonRequestParams & { url: string, contentType: BinaryContentType, body: Uint8Array };
export type SendPatchRequestParams = SendPostRequestParams;
export type SendDeleteRequestParams = CommonRequestParams & { url: string };
export interface OperationsBaseOptions {
  restClient: RestClient;
  api: { version: string };
  headers: HeaderFactories;
  parseErrorFunc: ParseErrorFunc;
}

export class OperationsBase<TOptions extends OperationsBaseOptions> {
  constructor(protected _options: TOptions) {
  }

  protected async sendGetRequest<TBody>(params: SendGetRequestParams & { responseType?: ContentType.Json }): Promise<HttpResponse<TBody>>;
  protected async sendGetRequest(params: SendGetRequestParams & { responseType: ContentType.Png }): Promise<HttpResponse<Uint8Array>>;
  protected async sendGetRequest<TBody>(params: SendGetRequestParams): Promise<HttpResponse<TBody | Uint8Array>> {
    const urlAndHeaders = {
      url: params.url,
      headers: await this.formHeaders(params)
    };

    if (params.responseType === ContentType.Png)
      return this.executeRequest(async () =>
        this._options.restClient.sendGetRequest({
          responseType: ContentType.Png,
          ...urlAndHeaders
        })
      );

    const responseType = params.responseType ?? ContentType.Json;
    return this.executeRequest(async () =>
      this._options.restClient.sendGetRequest<TBody>({
        responseType,
        ...urlAndHeaders
      })
    );
  }

  protected async sendPostRequest<TBody>(params: SendPostRequestParams): Promise<HttpResponse<TBody>> {
    return this.executeRequest(async () =>
      this._options.restClient.sendPostRequest<TBody>({
        url: params.url,
        body: {
          contentType: ContentType.Json,
          content: params.body
        },
        headers: await this.formHeaders({ ...params, contentType: ContentType.Json })
      })
    );
  }

  protected async sendPutRequest<TBody>(params: SendPutRequestParams): Promise<HttpResponse<TBody>> {
    return this.executeRequest(async () =>
      this._options.restClient.sendPutRequest<TBody>({
        url: params.url,
        body: {
          contentType: params.contentType,
          content: params.body
        },
        headers: await this.formHeaders({ ...params, contentType: params.contentType })
      })
    );
  }

  protected async sendPatchRequest<TBody>(params: SendPatchRequestParams): Promise<HttpResponse<TBody>> {
    return this.executeRequest(async () =>
      this._options.restClient.sendPatchRequest<TBody>({
        url: params.url,
        body: {
          contentType: ContentType.Json,
          content: params.body
        },
        headers: await this.formHeaders({ ...params, contentType: ContentType.Json })
      })
    );
  }

  protected async sendDeleteRequest<TBody>(params: SendDeleteRequestParams): Promise<HttpResponse<TBody>> {
    return this.executeRequest(async () =>
      this._options.restClient.sendDeleteRequest<TBody>({
        url: params.url,
        headers: await this.formHeaders(params)
      })
    );
  }

  protected async getEntityCollectionPage<TEntity, TResponse extends CollectionResponse>(params: CommonRequestParams & {
    url: string;
    preferReturn?: PreferReturn;
    entityCollectionAccessor: (response: HttpResponse<TResponse>) => TEntity[];
  }): Promise<EntityCollectionPage<TEntity>> {
    const response = await this.executeRequest(async () =>
      this.sendGetRequest<TResponse>(params)
    );
    return {
      entities: params.entityCollectionAccessor(response),
      next: response.body._links.next
        ? async () => this.getEntityCollectionPage({ ...params, url: response.body._links.next!.href })
        : undefined
    };
  }

  private async executeRequest<TBody>(requestFunc: () => Promise<HttpResponse<TBody>>): Promise<HttpResponse<TBody>> {
    try {
      const response = await requestFunc();
      return response;
    } catch (error: any) {
      if (error instanceof IModelsErrorBaseImpl)
        throw error;

      const parsedError: Error = this._options.parseErrorFunc({ statusCode: error.response?.status, body: error.response?.data }, error);
      throw parsedError;
    }
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
