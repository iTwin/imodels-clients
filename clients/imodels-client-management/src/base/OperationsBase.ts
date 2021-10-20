/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../Constants";
import { iModelsClientOptions } from "../iModelsClient";
import { CollectionResponse, EntityCollectionPage, OrderBy, PreferReturn, RequestContextParams } from "./interfaces/CommonInterfaces";
import { RecursiveRequired } from "./interfaces/UtilityTypes";
import { RestClient } from "./rest/RestClient";

type StringDictionary = { [key: string]: string; };

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;
type UrlParameterDictionary = { [key: string]: UrlParameterValue; };

type SendGetRequestParams = RequestContextParams & { url: string, preferReturn?: PreferReturn };
type SendPostRequestParams = RequestContextParams & { url: string, body: unknown };
type SendPatchRequestParams = SendPostRequestParams;
type SendDeleteRequestParams = RequestContextParams & { url: string };

export class OperationsBase {
  protected _restClient: RestClient;
  protected _apiBaseUrl: string;
  protected _apiVersion: string;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    this._restClient = options.restClient;
    this._apiBaseUrl = options.api.baseUri;
    this._apiVersion = options.api.version;
  }

  protected sendGetRequest<TResponse>(params: SendGetRequestParams): Promise<TResponse> {
    return this._restClient.sendGetRequest<TResponse>({
      url: params.url,
      headers: this.formHeaders(params)
    });
  }

  protected sendPostRequest<TResponse>(params: SendPostRequestParams): Promise<TResponse> {
    return this._restClient.sendPostRequest<TResponse>({
      url: params.url,
      body: params.body,
      headers: this.formHeaders({ ...params, containsBody: true })
    });
  }

  protected sendPatchRequest<TResponse>(params: SendPatchRequestParams): Promise<TResponse> {
    return this._restClient.sendPatchRequest<TResponse>({
      url: params.url,
      body: params.body,
      headers: this.formHeaders({ ...params, containsBody: true })
    });
  }

  protected sendDeleteRequest<TResponse>(params: SendDeleteRequestParams): Promise<TResponse> {
    return this._restClient.sendDeleteRequest<TResponse>({
      url: params.url,
      headers: this.formHeaders(params)
    });
  }

  protected async getEntityCollectionPage<TEntity>(params: RequestContextParams & {
    url: string,
    preferReturn: PreferReturn,
    entityCollectionAccessor: (response: unknown) => TEntity[]
  }): Promise<EntityCollectionPage<TEntity>> {
    const response = await this.sendGetRequest<CollectionResponse>(params);
    return {
      entities: params.entityCollectionAccessor(response),
      next: response._links.next
        ? () => this.getEntityCollectionPage({ ...params, url: response._links.next!.href })
        : undefined
    };
  }

  private formHeaders(params: RequestContextParams & { preferReturn?: PreferReturn, containsBody?: boolean }): UrlParameterDictionary {
    const headers: StringDictionary = {};
    headers[Constants.headers.authorization] = `${params.requestContext.authorization.scheme} ${params.requestContext.authorization.token}`;
    headers[Constants.headers.accept] = `application/vnd.bentley.${this._apiVersion}+json`;

    if (params.preferReturn)
      headers[Constants.headers.prefer] = `return=${params.preferReturn}`;

    if (params.containsBody)
      headers[Constants.headers.contentType] = Constants.headers.values.contentType;

    return headers;
  }

  protected formQueryString(urlParameters: UrlParameterDictionary | undefined): string | undefined {
    let queryString = "";
    const appendToQueryString = (key: string, value: string) => {
      const separator = queryString.length === 0 ? "?" : "&";
      queryString += `${separator}${key}=${value}`;
    };

    for (const urlParameterKey in urlParameters) {
      const urlParameterValue = urlParameters[urlParameterKey];
      if (!urlParameterValue)
        continue;

      appendToQueryString(urlParameterKey, this.stringify(urlParameterValue));
    }

    return queryString;
  }

  private stringify(urlParameterValue: UrlParameterValue): string {
    if (this.isOrderBy(urlParameterValue)) {
      let result: string = urlParameterValue.property;
      if (urlParameterValue.operator)
        result += ` ${urlParameterValue.operator}`;

      return result;
    }

    return urlParameterValue.toString();
  }

  private isOrderBy(parameterValue: UrlParameterValue): parameterValue is OrderByForAnyEntity {
    return (parameterValue as OrderByForAnyEntity).property !== undefined;
  }
}
