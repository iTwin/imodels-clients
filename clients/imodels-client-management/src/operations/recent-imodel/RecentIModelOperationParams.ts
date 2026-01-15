/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, HeadersParam } from "../../base/types";

/** Url parameters supported in recent iModel list query. */
export interface GetRecentIModelListUrlParams {
  /** Filters recent iModels for a specific iTwin. */
  iTwinId: string;
  /**
   * Specifies how many entities should be returned in an entity page. The value must not exceed 1000.
   * If not specified 100 entities per page will be returned.
   */
  $top?: number;
}

/** Parameters for get recent iModel list operation. */
export interface GetRecentIModelListParams
  extends AuthorizationParam,
    HeadersParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams: GetRecentIModelListUrlParams;
}

/** Parameters for add iModel to recents operation. */
export interface AddIModelToRecentsParams
  extends AuthorizationParam,
    HeadersParam {
  /** iModel id. iModel id must not be an empty or whitespace string. */
  iModelId: string;
}

/** Parameters for remove iModel from recents operation. */
export interface RemoveIModelFromRecentsParams
  extends AuthorizationParam,
    HeadersParam {
  /** iModel id. iModel id must not be an empty or whitespace string. */
  iModelId: string;
}
