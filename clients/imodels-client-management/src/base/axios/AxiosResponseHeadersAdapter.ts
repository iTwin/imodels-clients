/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosResponse } from "axios";

import { HttpResponseHeaders } from "../types/RestClient";
import { Dictionary } from "../types/UtilityTypes";

/** Default implementation for {@link HttpResponseHeaders} interface, which adapts `axios` HTTP response headers to headers expected by the iModels Client. */
export class AxiosResponseHeadersAdapter implements HttpResponseHeaders {
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
