/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { PreferReturn } from "./InternalModels";
import { RequestContextParam } from "./PublicModels";

export type QueryParameters = { [key: string]: string | number; };
export class BaseOperations {
  protected getHeaders(params: RequestContextParam & { preferReturn?: PreferReturn }): unknown {
    return {
      Authorization: `Bearer ${params.requestContext.accessToken}`,
      Prefer: `return=${params.preferReturn}`
    };
  }

  protected formUrlParams(queryParameters: QueryParameters): string | undefined {
    let queryString = undefined;
    const appendToQueryString = (key: string, value: string | number) => {
      if (!queryString) {
        queryString = `?${key}=${value}`;
      } else {
        queryString += `&${key}=${value}`;
      }
    };

    for (const key in queryParameters) {
      const queryParameterValue = queryParameters[key];
      if (!queryParameterValue)
        continue;

      appendToQueryString(key, queryParameterValue);
    }

    return queryString;
  }
}