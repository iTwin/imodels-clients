/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Constants } from "../Constants";
import { iModelsClientOptions } from "../iModelsClient";
import { CollectionResponse, EntityCollectionPage, PreferReturn, RequestContextParams, OrderBy } from "./interfaces/CommonInterfaces";
import { RecursiveRequired } from "./interfaces/UtilityTypes";
import { RestClient } from "./rest/RestClient";

type GenericOrderBy = OrderBy<{ [key: string]: unknown }, string>;
type QueryParameterValue = string | number | GenericOrderBy;
type QueryParameterDictionary = { [key: string]: QueryParameterValue; };

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

  private formHeaders(params: RequestContextParams & { preferReturn?: PreferReturn, containsBody?: boolean }): QueryParameterDictionary {
    const headers: QueryParameterDictionary = {};
    headers[Constants.Headers.Authorization] = `${params.requestContext.authorization.scheme} ${params.requestContext.authorization.token}`;
    headers[Constants.Headers.Accept] = `application/vnd.bentley.itwin-platform.${this._apiVersion}+json`;

    if (params.preferReturn)
      headers[Constants.Headers.Prefer] = `return=${params.preferReturn}`;

    if (params.containsBody)
      headers[Constants.Headers.ContentType] = Constants.Headers.Values.ContentType;

    return headers;
  }

  protected formUrlParams(queryParameters: QueryParameterDictionary | undefined): string | undefined {
    let queryString = "";
    const appendToQueryString = (key: string, value: string) => {
      if (!queryString) {
        queryString = `?${key}=${value}`;
      } else {
        queryString += `&${key}=${value}`;
      }
    };

    const stringify = (queryParameterValue: QueryParameterValue): string => {
      if (this.isOrderByParam(queryParameterValue)) {
        let result: string = queryParameterValue.property;
        if (queryParameterValue.operator)
          result += ` ${queryParameterValue.operator}`;

        return result;
      }

      return queryParameterValue.toString();
    }

    for (const key in queryParameters) {
      const queryParameterValue = queryParameters[key];
      if (!queryParameterValue)
        continue;

      appendToQueryString(key, stringify(queryParameterValue));
    }

    return queryString;
  }


  private isOrderByParam(param: QueryParameterValue): param is GenericOrderBy {
    return (param as GenericOrderBy).property !== undefined;
  }
}
