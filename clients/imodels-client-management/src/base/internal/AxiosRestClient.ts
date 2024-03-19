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

  public sendGetRequest<TBody>(params: HttpGetRequestParams & { responseType: ContentType.Json }): Promise<HttpResponse<TBody>>;
  public sendGetRequest(params: HttpGetRequestParams & { responseType: ContentType.Png }): Promise<HttpResponse<Uint8Array>>;
  public async sendGetRequest<TBody>(params: HttpGetRequestParams): Promise<HttpResponse<TBody | Uint8Array>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    if (params.responseType === ContentType.Png) {
      requestConfig.responseType = "arraybuffer";
      const response = await this.executeRequest(async () => axios.get(params.url, requestConfig));

      const data: Buffer | ArrayBuffer = response.body;
      if (data instanceof ArrayBuffer)
        return { ...response, body: new Uint8Array(data) };

      return response;
    }

    return this.executeRequest(async () => axios.get(params.url, requestConfig));
  }

  public async sendPostRequest<TBody>(params: HttpRequestWithJsonBodyParams): Promise<HttpResponse<TBody>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.post(params.url, params.body.content ?? {}, requestConfig));
  }

  public async sendPutRequest<TBody>(params: HttpRequestWithBinaryBodyParams): Promise<HttpResponse<TBody>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.put(params.url, params.body.content, requestConfig));
  }

  public async sendPatchRequest<TBody>(params: HttpRequestWithJsonBodyParams): Promise<HttpResponse<TBody>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.patch(params.url, params.body.content ?? {}, requestConfig));
  }

  public async sendDeleteRequest<TBody>(params: HttpRequestParams): Promise<HttpResponse<TBody>> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    return this.executeRequest(async () => axios.delete(params.url, requestConfig));
  }

  private async executeRequest<TBody>(requestFunc: () => Promise<AxiosResponse<TBody>>): Promise<HttpResponse<TBody>> {
    try {
      const response = await requestFunc();

      return {
        body: response.data,
        headers: {
          get: (headerName: string) => {
            // Directly manipulating headers object is deprecated.
            // https://github.com/axios/axios?tab=readme-ov-file#-axiosheaders
            if (response.headers.get instanceof Function)
              return response.headers.get(headerName);

            // It's most likely that header name is lowercase.
            // https://axios-http.com/docs/res_schema
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
