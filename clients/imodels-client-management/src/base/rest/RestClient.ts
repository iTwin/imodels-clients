/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Dictionary } from "../interfaces/UtilityTypes";

export type ParseErrorFunc = (response: { statusCode?: number, body?: unknown }) => Error;

export interface HttpRequestParams {
  url: string;
  headers: Dictionary<string>;
}

export interface HttpRequestWithBodyParams extends HttpRequestParams {
  body: unknown;
}

export interface RestClient {
  sendGetRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
  sendPostRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse>;
  sendPatchRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse>;
  sendDeleteRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
}
