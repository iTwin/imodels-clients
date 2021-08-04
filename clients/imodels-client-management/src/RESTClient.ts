/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

export class RESTClient {
  private _parseErrorFunc: (response: { statusCode: number, body: unknown }) => void;

  constructor(parseErrorFunc: (response: { statusCode: number, body: unknown }) => void) {
    this._parseErrorFunc = parseErrorFunc;
  }

  public sendGetRequest<TResponse>(params: { url: string, headers: unknown }): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.get(params.url, requestConfig)
      .then(this.handleSuccess)
      .catch(this.handleError);
  }

  public sendPostRequest<TResponse>(params: { url: string, headers: unknown, body: unknown }): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.post(params.url, params.body, requestConfig)
      .then(this.handleSuccess)
      .catch(this.handleError);
  }

  public sendDeleteRequest<TResponse>(params: { url: string, headers: unknown }): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.delete(params.url, requestConfig)
      .then(this.handleSuccess)
      .catch(this.handleError);
  }

  private handleError<TResponse>(errorResponse: AxiosError<TResponse>): void {
    Promise.reject(this._parseErrorFunc({ statusCode: errorResponse.response.status, body: errorResponse.response.data }));
  }

  private handleSuccess<TResponse>(response: AxiosResponse<TResponse>): TResponse {
    return response.data;
  }
}

