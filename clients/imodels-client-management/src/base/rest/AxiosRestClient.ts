/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { iModelsErrorParser } from "../iModelsErrorParser";
import { RestClient, HttpRequestParams, HttpRequestWithBodyParams, ParseErrorFunc } from "./RestClient";

export class AxiosRestClient implements RestClient {
  private _parseErrorFunc: ParseErrorFunc;

  constructor(parseErrorFunc: ParseErrorFunc = iModelsErrorParser.parse) {
    this._parseErrorFunc = parseErrorFunc;
  }

  public sendGetRequest<TResponse>(params: HttpRequestParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.get(params.url, requestConfig)
      .then((successResponse: AxiosResponse<TResponse>) => this.handleSuccess(successResponse))
      .catch((errorResponse: AxiosError<TResponse>) => this.handleError(errorResponse));
  }

  public sendPostRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.post(params.url, params.body ?? {}, requestConfig)
      .then((successResponse: AxiosResponse<TResponse>) => this.handleSuccess(successResponse))
      .catch((errorResponse: AxiosError<TResponse>) => this.handleError(errorResponse));
  }

  public sendPatchRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.patch(params.url, params.body ?? {}, requestConfig)
      .then((successResponse: AxiosResponse<TResponse>) => this.handleSuccess(successResponse))
      .catch((errorResponse: AxiosError<TResponse>) => this.handleError(errorResponse));
  }

  public sendDeleteRequest<TResponse>(params: HttpRequestParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return axios.delete(params.url, requestConfig)
      .then((successResponse: AxiosResponse<TResponse>) => this.handleSuccess(successResponse))
      .catch((errorResponse: AxiosError<TResponse>) => this.handleError(errorResponse));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError<TResponse>(errorResponse: AxiosError<TResponse>): any {
    return Promise.reject(this._parseErrorFunc({ statusCode: errorResponse.response?.status, body: errorResponse.response?.data }));
  }

  private handleSuccess<TResponse>(response: AxiosResponse<TResponse>): TResponse {
    return response.data;
  }
}