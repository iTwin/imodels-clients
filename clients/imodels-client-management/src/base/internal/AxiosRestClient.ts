/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { ContentType, HttpGetRequestParams, HttpRequestParams, HttpRequestWithBinaryBodyParams, HttpRequestWithJsonBodyParams, HttpResponse, RestClient } from "../types/RestClient";

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

  public sendGetRequest<TData>(params: HttpGetRequestParams & { responseType: ContentType.Json }): Promise<HttpResponse<TData>>;
  public sendGetRequest(params: HttpGetRequestParams & { responseType: ContentType.Png }): Promise<HttpResponse<Uint8Array>>;
  public async sendGetRequest<TData>(params: HttpGetRequestParams): Promise<HttpResponse<TData | Uint8Array>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    if (params.responseType === ContentType.Png) {
      requestConfig.responseType = "arraybuffer";
      const response = await this.executeRequest(async () => axios.get(params.url, requestConfig));

      const data: Buffer | ArrayBuffer = response.data;
      if (data instanceof ArrayBuffer)
        return { ...response, data: new Uint8Array(data) };

      return response;
    }

    return this.executeRequest(async () => axios.get(params.url, requestConfig));
  }

  public async sendPostRequest<TData>(params: HttpRequestWithJsonBodyParams): Promise<HttpResponse<TData>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.post(params.url, params.body.content ?? {}, requestConfig));
  }

  public async sendPutRequest<TData>(params: HttpRequestWithBinaryBodyParams): Promise<HttpResponse<TData>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.put(params.url, params.body.content, requestConfig));
  }

  public async sendPatchRequest<TData>(params: HttpRequestWithJsonBodyParams): Promise<HttpResponse<TData>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.patch(params.url, params.body.content ?? {}, requestConfig));
  }

  public async sendDeleteRequest<TData>(params: HttpRequestParams): Promise<HttpResponse<TData>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.delete(params.url, requestConfig));
  }

  private async executeRequest<TData>(requestFunc: () => Promise<AxiosResponse<TData>>): Promise<HttpResponse<TData>> {
    try {
      const response = await requestFunc();

      return {
        data: response.data,
        headers: {
          get: (headerName: string) => {
            // Directly manipulating headers object is deprecated.
            // https://github.com/axios/axios?tab=readme-ov-file#-axiosheaders
            if (response.headers.get instanceof Function)
              return response.headers.get(headerName);

            // It's most likely that header name is lowercase.
            return response.headers[headerName.toLowerCase()];
          }
        }
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const parsedError: Error = this._parseErrorFunc({ statusCode: error.response?.status, body: error.response?.data }, error);
        throw parsedError;
      }
      throw error;
    }
  }
}
