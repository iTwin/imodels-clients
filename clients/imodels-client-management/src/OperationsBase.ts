/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { PreferReturn } from "./InternalCommonInterfaces";
import { RequestContextParam } from "./PublicCommonInterfaces";
import { RestClient } from "./RESTClient";

type Dictionary = { [key: string]: string | number; };

export class OperationsBase {
  protected _apiBaseUrl = "https://api.bentley.com/imodels";
  protected _apiVersion = "v1";

  constructor(protected _restClient: RestClient) {
  }

  protected sendGetRequest<TResponse>(params: RequestContextParam & { url: string, preferReturn?: PreferReturn }): Promise<TResponse> {
    return this._restClient.sendGetRequest<TResponse>({
      url: params.url,
      headers: this.formHeaders(params)
    });
  }

  protected sendPostRequest<TResponse>(params: RequestContextParam & { url: string, body: unknown }): Promise<TResponse> {
    return this._restClient.sendPostRequest<TResponse>({
      url: params.url,
      body: params.body,
      headers: this.formHeaders(params)
    });
  }

  protected sendDeleteRequest<TResponse>(params: RequestContextParam & { url: string }): Promise<TResponse> {
    return this._restClient.sendDeleteRequest<TResponse>({
      url: params.url,
      headers: this.formHeaders(params)
    });
  }

  private formHeaders(params: RequestContextParam & { preferReturn?: PreferReturn }): Dictionary {
    const headers: Dictionary = {
      Authorization: `${params.requestContext.authorizationHeader.scheme} ${params.requestContext.authorizationHeader.credentials}`,
      Accept: `application/vnd.bentley.itwin-platform.${this._apiVersion}+json`
    };

    if (params.preferReturn)
      headers.Prefer = `return=${params.preferReturn}`;

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
