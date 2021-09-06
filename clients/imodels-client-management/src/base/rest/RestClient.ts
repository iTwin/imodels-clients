/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export type HttpRequestParams = { url: string, headers: unknown };
export type HttpRequestWithBodyParams = HttpRequestParams & { body: unknown };

export type ParseErrorFunc = (response: { statusCode: number, body: unknown }) => Error;

export interface RestClient {
  sendGetRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
  sendPostRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse>;
  sendDeleteRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
}
