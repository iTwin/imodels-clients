/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Dictionary } from "../interfaces/UtilityTypes";

/**
 * Function that is called if the HTTP request fails and which returns an error that will be thrown by one of the
 * methods in {@link RestClient}.
 */
export type ParseErrorFunc = (response: { statusCode?: number, body?: unknown }) => Error;

/** Common parameters for all HTTP request operations. */
export interface HttpRequestParams {
  /** Request url. */
  url: string;
  /** Headers to be sent with the request. */
  headers: Dictionary<string>;
}

/** Common parameters for HTTP request operations that can contain a body. */
export interface HttpRequestWithBodyParams extends HttpRequestParams {
  /** Request body. */
  body: unknown;
}

/**
 * Client used for sending HTTP requests. It supports common HTTP methods that are used by
 * operations in this library.
 */
export interface RestClient {
  /**
   * Sends GET HTTP request.
   * @param {HttpRequestParams} params parameters for this operation. See {@link HttpRequestParams}.
   * @throws an error if the request fails.
   */
  sendGetRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
  /**
   * Sends POST HTTP request.
   * @param {HttpRequestWithBodyParams} params parameters for this operation. See {@link HttpRequestWithBodyParams}.
   * @throws an error if the request fails.
   */
  sendPostRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse>;
  /**
   * Sends PATCH HTTP request.
   * @param {HttpRequestWithBodyParams} params parameters for this operation. See {@link HttpRequestWithBodyParams}.
   * @throws an error if the request fails.
   */
  sendPatchRequest<TResponse>(params: HttpRequestWithBodyParams): Promise<TResponse>;
  /**
   * Sends DELETE HTTP request.
   * @param {HttpRequestParams} params parameters for this operation. See {@link HttpRequestParams}.
   * @throws an error if the request fails.
   */
  sendDeleteRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
}
