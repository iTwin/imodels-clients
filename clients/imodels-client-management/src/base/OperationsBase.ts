/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClientOptions } from "../iModelsClient";
import { PreferReturn, RequestContextParam } from "./interfaces/CommonInterfaces";
import { RecursiveRequired } from "./interfaces/UtilityTypes";
import { RestClient } from "./rest/RestClient";

type Dictionary = { [key: string]: string | number; };

type SendGetRequestParams = RequestContextParam & { url: string, preferReturn?: PreferReturn };
type SendPostRequestParams = RequestContextParam & { url: string, body: unknown };
type SendDeleteRequestParams = RequestContextParam & { url: string };

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

  protected sendDeleteRequest<TResponse>(params: SendDeleteRequestParams): Promise<TResponse> {
    return this._restClient.sendDeleteRequest<TResponse>({
      url: params.url,
      headers: this.formHeaders(params)
    });
  }

  private formHeaders(params: RequestContextParam & { preferReturn?: PreferReturn, containsBody?: boolean }): Dictionary {
    const headers: Dictionary = {
      Authorization: `${params.requestContext.authorization.scheme} ${params.requestContext.authorization.token}`,
      Accept: `application/vnd.bentley.itwin-platform.${this._apiVersion}+json`
    };

    if (params.preferReturn)
      headers.Prefer = `return=${params.preferReturn}`;

    if (params.containsBody)
      headers["Content-Type"] = "application/json";

    return headers;
  }

  protected formUrlParams(queryParameters: Dictionary): string | undefined {
    let queryString = undefined;
    const appendToQueryString = (key: string, value: string | number) => {
      if (!queryString) {
        queryString = `?${key}=${value}`;
      } else {
        queryString += `&${key}=${value}`;
      }
    };

    for (const key in queryParameters) {
      const queryParameterValue = queryParameters[key];
      if (!queryParameterValue)
        continue;

      appendToQueryString(key, queryParameterValue);
    }

    return queryString;
  }
}
