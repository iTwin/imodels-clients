/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, HeadersParam } from "../../base/types";

/** Url parameters supported in favorite iModel list query. */
export interface GetFavoriteIModelListUrlParams {
  /** Filters favorite iModels for a specific iTwin. */
  iTwinId: string;
  /**
   * Specifies how many entities should be returned in an entity page. The value must not exceed 1000.
   * If not specified 100 entities per page will be returned.
   */
  $top?: number;
  /**
   * Specifies token to retrieve next page in paginated response.
   * To start using the token empty continuation token should be provided with the first request.
   */
  $continuationToken?: string;
}

/** Parameters for get favorite iModel list operation. */
export interface GetFavoriteIModelListParams
  extends AuthorizationParam,
    HeadersParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams: GetFavoriteIModelListUrlParams;
}

/** Parameters for add iModel to favorites operation. */
export interface AddIModelToFavoritesParams
  extends AuthorizationParam,
    HeadersParam {
  /** iModel id. iModel id must not be an empty or whitespace string. */
  iModelId: string;
}

/** Parameters for remove iModel from favorites operation. */
export interface RemoveIModelFromFavoritesParams
  extends AuthorizationParam,
    HeadersParam {
  /** iModel id. iModel id must not be an empty or whitespace string. */
  iModelId: string;
}
