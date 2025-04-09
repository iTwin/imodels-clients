/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { HttpRequestRetryPolicy, IModelsOriginalError } from "../types/index.js";
import { ContentType, HttpGetRequestParams, HttpRequestParams, HttpRequestWithBinaryBodyParams, HttpRequestWithJsonBodyParams, HttpResponse, RestClient } from "../types/RestClient.js";

import { AxiosResponseHeadersAdapter } from "./AxiosResponseHeadersAdapter.js";
import { ResponseInfo } from "./IModelsErrorParser.js";
import { sleep } from "./UtilityFunctions.js";

/**
 * Function that is called if the HTTP request fails and which returns an error that will be thrown by one of the
 * methods in {@link RestClient}.
 */
export type ParseErrorFunc = (response: ResponseInfo, originalError: IModelsOriginalError) => Error;

/** Default implementation for {@link RestClient} interface that uses `axios` library for sending the requests. */
export class AxiosRestClient implements RestClient {
  private static readonly retryCountUpperBound = 10;

  private _parseErrorFunc: ParseErrorFunc;
  private _retryPolicy: HttpRequestRetryPolicy | null;

  constructor(parseErrorFunc: ParseErrorFunc, retryPolicy: HttpRequestRetryPolicy | null) {
    this._parseErrorFunc = parseErrorFunc;
    this._retryPolicy = retryPolicy;
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
      const response = await this.executeWithRetry(requestFunc);

      return {
        body: response.data,
        headers: new AxiosResponseHeadersAdapter(response)
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const parsedError: Error = this._parseErrorFunc({ statusCode: error.response?.status, body: error.response?.data }, error);
        throw parsedError;
      }
      throw error;
    }
  }

  private async executeWithRetry<TBody>(requestFunc: () => Promise<AxiosResponse<TBody>>): Promise<AxiosResponse<TBody>> {
    let retriesInvoked = 0;
    for (;;) {
      try {
        return await requestFunc();
      } catch (error: unknown) {
        if (
          this._retryPolicy === null ||
          retriesInvoked >= this._retryPolicy.maxRetries ||
          retriesInvoked >= AxiosRestClient.retryCountUpperBound ||
          !(await this._retryPolicy.shouldRetry({ retriesInvoked, error }))
        ) {
          throw error;
        }

        const sleepDurationInMs = this._retryPolicy.getSleepDurationInMs({ retriesInvoked: retriesInvoked++ });
        if (sleepDurationInMs > 0) {
          await sleep(sleepDurationInMs);
        }
      }
    }
  }
}

