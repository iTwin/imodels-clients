/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../Constants";
import { AuthorizationParam, CollectionResponse, PreferReturn } from "./interfaces/CommonInterfaces";
import { Dictionary, EntityCollectionPage } from "./interfaces/UtilityTypes";
import { ContentType, RestClient, BinaryContentType, SupportedGetResponseTypes } from "./rest/RestClient";

type SendGetRequestParams = AuthorizationParam & { url: string, preferReturn?: PreferReturn, responseType?: SupportedGetResponseTypes };
type SendPostRequestParams = AuthorizationParam & { url: string, body: object | undefined };
type SendPutRequestParams = AuthorizationParam & { url: string, contentType: BinaryContentType, body: Uint8Array };
type SendPatchRequestParams = SendPostRequestParams;
type SendDeleteRequestParams = AuthorizationParam & { url: string };

export interface OperationsBaseOptions {
  restClient: RestClient;
  api: { version: string };
}

export class OperationsBase<TOptions extends OperationsBaseOptions> {
  constructor(protected _options: TOptions) {
  }

  protected async sendGetRequest<TResponse>(params: SendGetRequestParams): Promise<TResponse> {
    return this._options.restClient.sendGetRequest<TResponse>({
      url: params.url,
      responseType: params.responseType ?? ContentType.Json,
      headers: await this.formHeaders(params)
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

  protected async getEntityCollectionPage<TEntity>(params: AuthorizationParam & {
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

  private async formHeaders(params: AuthorizationParam & { preferReturn?: PreferReturn, contentType?: ContentType }): Promise<Dictionary<string>> {
    const headers: Dictionary<string> = {};
    const authorizationInfo = await params.authorization();
    headers[Constants.headers.authorization] = `${authorizationInfo.scheme} ${authorizationInfo.token}`;
    headers[Constants.headers.accept] = `application/vnd.bentley.${this._options.api.version}+json`;

    if (params.preferReturn)
      headers[Constants.headers.prefer] = `return=${params.preferReturn}`;

    if (params.contentType)
      headers[Constants.headers.contentType] = params.contentType;

    return headers;
  }
}
