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

/**
 * Content-Type header values that are used with for iModels API.
 */
export enum ContentType {
  Json = "application/json",
  Png = "image/png",
  Jpeg = "image/jpeg"
}

/** Helper type to group all supported binary content types. */
export type BinaryContentType = ContentType.Png | ContentType.Jpeg;

/** Helper type to group all response content types that are supported in GET requests. */
export type SupportedGetResponseTypes = ContentType.Json | ContentType.Png;

/** Request body that contains JSON content. */
export interface JsonBody {
  /** Type of the content described by `Content-Type` header value - `application/json`. */
  contentType: ContentType.Json;
  /** Object to be serialized to JSON. */
  content: object | undefined;
}

/** Request body that contains binary data. */
export interface BinaryBody {
  /** Type of the content described by standard `Content-Type` header values. */
  contentType: BinaryContentType;
  /** Binary data. */
  content: Uint8Array;
}

/** Common parameters for all HTTP request operations. */
export interface HttpRequestParams {
  /** Request url. */
  url: string;
  /** Headers to be sent with the request. */
  headers: Dictionary<string>;
}

/** Common parameters for HTTP GET request operation. */
export interface HttpGetRequestParams extends HttpRequestParams {
  /**
   * Expected type of the response content. This information is relevant when deserializing the
   * response data as usually binary and JSON response types require different handling.
   */
  responseType: SupportedGetResponseTypes;
}

/** Common parameters for HTTP request operations that can contain a JSON body. */
export interface HttpRequestWithJsonBodyParams extends HttpRequestParams {
  /** Request body. */
  body: JsonBody;
}

/** Common parameters for HTTP request operations that contain a binary body. */
export interface HttpRequestWithBinaryBodyParams extends HttpRequestParams {
  /** Request body. */
  body: BinaryBody;
}

/**
 * Client used for sending HTTP requests. It supports common HTTP methods that are used by
 * operations in this library.
 */
export interface RestClient {
  /**
   * Sends GET HTTP request to get JSON response.
   * @param {HttpGetRequestParams} params parameters for this operation. See {@link HttpGetRequestParams}.
   * @throws an error if the request fails.
   */
  sendGetRequest<TResponse>(params: HttpGetRequestParams & { responseType: ContentType.Json }): Promise<TResponse>;

  /**
   * Sends GET HTTP request to get binary response.
   * @param {HttpGetRequestParams} params parameters for this operation. See {@link HttpGetRequestParams}.
   * @throws an error if the request fails.
   */
  sendGetRequest(params: HttpGetRequestParams & { responseType: ContentType.Png }): Promise<Uint8Array>;

  /**
   * Sends POST HTTP request.
   * @param {HttpRequestWithBodyParams} params parameters for this operation. See {@link HttpRequestWithBodyParams}.
   * @throws an error if the request fails.
   */
  sendPostRequest<TResponse>(params: HttpRequestWithJsonBodyParams): Promise<TResponse>;

  /**
   * Sends PUT HTTP request.
   * @param {HttpPutRequestParams} params parameters for this operation. See {@link HttpRequestWithBodyParams}.
   * @throws an error if the request fails.
   */
  sendPutRequest<TResponse>(params: HttpRequestWithBinaryBodyParams): Promise<TResponse>;

  /**
   * Sends PATCH HTTP request.
   * @param {HttpRequestWithBodyParams} params parameters for this operation. See {@link HttpRequestWithBodyParams}.
   * @throws an error if the request fails.
   */
  sendPatchRequest<TResponse>(params: HttpRequestWithJsonBodyParams): Promise<TResponse>;

  /**
   * Sends DELETE HTTP request.
   * @param {HttpRequestParams} params parameters for this operation. See {@link HttpRequestParams}.
   * @throws an error if the request fails.
   */
  sendDeleteRequest<TResponse>(params: HttpRequestParams): Promise<TResponse>;
}
