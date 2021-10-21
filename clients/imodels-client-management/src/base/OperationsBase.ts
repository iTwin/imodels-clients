/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../Constants";
import { iModelsClientOptions } from "../iModelsClient";
import { CollectionResponse, EntityCollectionPage, OrderBy, PreferReturn, AuthorizationParam } from "./interfaces/CommonInterfaces";
import { Dictionary, RecursiveRequired } from "./interfaces/UtilityTypes";
import { RestClient } from "./rest/RestClient";

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;

type SendGetRequestParams = AuthorizationParam & { url: string, preferReturn?: PreferReturn };
type SendPostRequestParams = AuthorizationParam & { url: string, body: unknown };
type SendPatchRequestParams = SendPostRequestParams;
type SendDeleteRequestParams = AuthorizationParam & { url: string };

export class OperationsBase {
  protected _restClient: RestClient;
  protected _apiBaseUrl: string;
  protected _apiVersion: string;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    this._restClient = options.restClient;
    this._apiBaseUrl = options.api.baseUri;
    this._apiVersion = options.api.version;
  }

  protected async sendGetRequest<TResponse>(params: SendGetRequestParams): Promise<TResponse> {
    return this._restClient.sendGetRequest<TResponse>({
      url: params.url,
      headers: await this.formHeaders(params)
    });
  }

  protected async sendPostRequest<TResponse>(params: SendPostRequestParams): Promise<TResponse> {
    return this._restClient.sendPostRequest<TResponse>({
      url: params.url,
      body: params.body,
      headers: await this.formHeaders({ ...params, containsBody: true })
    });
  }

  protected async sendPatchRequest<TResponse>(params: SendPatchRequestParams): Promise<TResponse> {
    return this._restClient.sendPatchRequest<TResponse>({
      url: params.url,
      body: params.body,
      headers: await this.formHeaders({ ...params, containsBody: true })
    });
  }

  protected async sendDeleteRequest<TResponse>(params: SendDeleteRequestParams): Promise<TResponse> {
    return this._restClient.sendDeleteRequest<TResponse>({
      url: params.url,
      headers: await this.formHeaders(params)
    });
  }

  protected async getEntityCollectionPage<TEntity>(params: AuthorizationParam & {
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

  private async formHeaders(params: AuthorizationParam & { preferReturn?: PreferReturn, containsBody?: boolean }): Promise<Dictionary<string>> {
    const headers: Dictionary<string> = {};
    const authorizationInfo = await params.authorization();
    headers[Constants.headers.authorization] = `${authorizationInfo.scheme} ${authorizationInfo.token}`;
    headers[Constants.headers.accept] = `application/vnd.bentley.${this._apiVersion}+json`;

    if (params.preferReturn)
      headers[Constants.headers.prefer] = `return=${params.preferReturn}`;

    if (params.containsBody)
      headers[Constants.headers.contentType] = Constants.headers.values.contentType;

    return headers;
  }

  protected formQueryString(urlParameters: Dictionary<UrlParameterValue> | undefined): string {
    let queryString = "";
    for (const urlParameterKey in urlParameters) {
      const urlParameterValue = urlParameters[urlParameterKey];
      if (!urlParameterValue)
        continue;

      queryString = this.appendToQueryString(queryString, urlParameterKey, urlParameterValue);
    }

    return queryString;
  }

  private appendToQueryString(existingQueryString: string, parameterKey: string, parameterValue: UrlParameterValue): string {
    const separator = existingQueryString.length === 0 ? "?" : "&";
    return existingQueryString + `${separator}${parameterKey}=${this.stringify(parameterValue)}`;
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
