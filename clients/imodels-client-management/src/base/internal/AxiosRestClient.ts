/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { Dictionary } from "../types";
import { ContentType, HttpGetRequestParams, HttpRequestParams, HttpRequestWithBinaryBodyParams, HttpRequestWithJsonBodyParams, HttpResponse, HttpResponseHeaders, RestClient } from "../types/RestClient";

/**
 * Function that is called if the HTTP request fails and which returns an error that will be thrown by one of the
 * methods in {@link RestClient}.
 */
export type ParseErrorFunc = (response: { statusCode?: number, body?: unknown }, originalError: Error & { code?: string }) => Error;

/** A factory for creating {@link HttpResponseHeaders} from {@link AxiosResponse}. */
export interface HttpResponseHeadersFactory {
  create(response: AxiosResponse): HttpResponseHeaders;
}

/** Default implementation for {@link RestClient} interface that uses `axios` library for sending the requests. */
export class AxiosRestClient implements RestClient {
  private _parseErrorFunc: ParseErrorFunc;
  private _responseHeadersFactory: HttpResponseHeadersFactory;

  constructor(parseErrorFunc: ParseErrorFunc, responseHeadersFactory: HttpResponseHeadersFactory) {
    this._parseErrorFunc = parseErrorFunc;
    this._responseHeadersFactory = responseHeadersFactory;
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
        headers: this._responseHeadersFactory.create(response)
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

/** Default implementation for {@link HttpResponseHeadersFactory}. */
export class AxiosHeadersAdapterFactory implements HttpResponseHeadersFactory {
  public create(response: AxiosResponse): HttpResponseHeaders {
    return new AxiosHeadersAdapter(response);
  }
}

/** Default implementation for {@link HttpResponseHeaders} interface, which adapts `axios` HTTP response headers to headers expected by the iModels Client. */
export class AxiosHeadersAdapter implements HttpResponseHeaders {
  private _response: AxiosResponse;

  constructor(response: AxiosResponse) {
    this._response = response;
  }

  public get(headerName: string): unknown {
    // Directly manipulating headers object is deprecated.
    // https://github.com/axios/axios?tab=readme-ov-file#-axiosheaders
    if (this._response.headers.get instanceof Function)
      return this._response.headers.get(headerName);

    // It's most likely that header name is lowercase.
    // https://axios-http.com/docs/res_schema
    return this._response.headers[headerName.toLowerCase()];
  }

  public getAll(): Dictionary<unknown> {
    return this._response.headers;
  }
}
