/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { ContentType, HttpGetRequestParams, HttpRequestParams, HttpRequestWithBinaryBodyParams, HttpRequestWithJsonBodyParams, RestClient } from "../types/RestClient";

/**
 * Function that is called if the HTTP request fails and which returns an error that will be thrown by one of the
 * methods in {@link RestClient}.
 */
export type ParseErrorFunc = (response: { statusCode?: number, body?: unknown }, originalError: Error & { code?: string }) => Error;

/** Default implementation for {@link RestClient} interface that uses `axios` library for sending the requests. */
export class AxiosRestClient implements RestClient {
  private _parseErrorFunc: ParseErrorFunc;

  constructor(parseErrorFunc: ParseErrorFunc) {
    this._parseErrorFunc = parseErrorFunc;
  }

  public sendGetRequest<TResponse>(params: HttpGetRequestParams & { responseType: ContentType.Json }): Promise<TResponse>;
  public sendGetRequest(params: HttpGetRequestParams & { responseType: ContentType.Png }): Promise<Uint8Array>;
  public async sendGetRequest<TResponse>(params: HttpGetRequestParams): Promise<TResponse | Uint8Array> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    if (params.responseType === ContentType.Png) {
      requestConfig.responseType = "arraybuffer";
      const responseData: Buffer | ArrayBuffer = await this.executeRequest(async () => axios.get(params.url, requestConfig));
      if (responseData instanceof ArrayBuffer)
        return new Uint8Array(responseData);
      return responseData;
    }

    return this.executeRequest(async () => axios.get(params.url, requestConfig));
  }

  public async sendPostRequest<TResponse>(params: HttpRequestWithJsonBodyParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.post(params.url, params.body.content ?? {}, requestConfig));
  }

  public async sendPutRequest<TResponse>(params: HttpRequestWithBinaryBodyParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.put(params.url, params.body.content, requestConfig));
  }

  public async sendPatchRequest<TResponse>(params: HttpRequestWithJsonBodyParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.patch(params.url, params.body.content ?? {}, requestConfig));
  }

  public async sendDeleteRequest<TResponse>(params: HttpRequestParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };
    return this.executeRequest(async () => axios.delete(params.url, requestConfig));
  }

  private async executeRequest<TResponse>(requestFunc: () => Promise<AxiosResponse<TResponse>>): Promise<TResponse> {
    try {
      const response = await requestFunc();
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const parsedError: Error = this._parseErrorFunc({ statusCode: error.response?.status, body: error.response?.data }, error);
        throw parsedError;
      }
      throw error;
    }
  }
}
