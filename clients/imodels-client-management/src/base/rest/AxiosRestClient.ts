/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { IModelsErrorParser } from "../IModelsErrorParser";
import { ContentType, HttpGetRequestParams, HttpRequestParams, HttpRequestWithBinaryBodyParams, HttpRequestWithJsonBodyParams, ParseErrorFunc, RestClient } from "./RestClient";

/** Default implementation for {@link RestClient} interface that uses `axios` library for sending the requests. */
export class AxiosRestClient implements RestClient {
  private _parseErrorFunc: ParseErrorFunc;

  constructor(parseErrorFunc: ParseErrorFunc = IModelsErrorParser.parse) {
    this._parseErrorFunc = parseErrorFunc;
  }

  public async sendGetRequest<TResponse>(params: HttpGetRequestParams): Promise<TResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: params.headers
    };

    if (params.responseType === ContentType.Png) {
      requestConfig.responseType = "arraybuffer";
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
        const parsedError: Error = this._parseErrorFunc({ statusCode: error.response?.status, body: error.response?.data });
        throw parsedError;
      }
      throw new Error("AxiosRestClient: unknown error occurred.");
    }
  }
}
