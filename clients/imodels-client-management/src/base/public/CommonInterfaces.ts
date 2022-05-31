/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** iModels API endpoint options. */
export interface ApiOptions {
  /** iModels API base url. Default value is `https://api.bentley.com/imodels`. */
  baseUrl?: string;
  /** iModels API version. Default value is `itwin-platform.v1`. */
  version?: string;
}

/**
 * Request authorization data. This data is sent to the server in `Authorization` request header, the header value is
 * formatted by joining `scheme` and `token` property values with a single space.
 */
export interface Authorization {
  /**
   * Authentication scheme. For information on supported authentication schemes see
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-details/#authentication iModels API documenation}.
   */
  scheme: string;
  /** Access token. */
  token: string;
}

/**
 * Interface for a function that returns authorization data. It is up to the consumer of this library to implement
 * user authentication and pass that function as an argument into all specific operation functions.
 * This function will be called every time a request is sent to the API meaning that it can be called more than
 * once during a single operation execution. Authorization retrieval should be performant and utilize caching when
 * appropriate. See {@link Authorization}.
 */
export type AuthorizationCallback = () => Promise<Authorization>;

/** Authorization data parameter. This interface is extended by all other specific operation parameter interfaces. */
export interface AuthorizationParam {
  /** Function that returns valid authorization data. See {@link AuthorizationCallback}. */
  authorization: AuthorizationCallback;
}

/**
 * Common parameters for iModel scoped operations. All operations exposed in this client are iModel scoped
 * except for {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels}.
 */
export interface IModelScopedOperationParams extends AuthorizationParam {
  /** iModel id. */
  iModelId: string;
}

/** Common url parameters that are supported for all entity list requests. */
export interface CollectionRequestParams {
  /** Specifies how many entities should be skipped in an entity page. The value must not exceed 1000. */
  $skip?: number;
  /**
   * Specifies how many entities should be returned in an entity page. The value must not exceed 1000.
   * If not specified 100 entities per page will be returned.
   */
  $top?: number;
}

/** Entity list ordering operators that are supported in $orderBy url parameter. */
export enum OrderByOperator {
  /** Ascending. Entities will be returned in ascending order. */
  Ascending = "asc",
  /** Descending. Entities will be returned in descending order. */
  Descending = "desc"
}

/**
 * Generic interface for $orderBy url parameter. This url parameter is supported in some of the entity list requests
 * and describes in what order should the items be returned. This structured object is later formatted into a string
 * when appending it to url by joining `property` and `operator` property values with a single space.
 */
export interface OrderBy<TEntity, TProperties extends keyof TEntity> {
  /** Entity property that should be compared when ordering elements. */
  property: TProperties;
  /**
   * Operator that should be used for ordering. If not specified the API will return entities in ascending order.
   * See {@link OrderByOperator}.
   */
  operator?: OrderByOperator;
}

/** Link to some other entity or entity list that is related to the main entity in the API response. */
export interface Link {
  /** Url to access the related entity. */
  href: string;
}

/**
 * Links that are included in all entity list page responses. They simplify pagination implementation because users
 * can send requests using these urls that already include pagination url parameters without having to
 * manually keep track of queried entity count.
 */
export interface CollectionLinks {
  /** Link to the current page. */
  self: Link;
  /** Link to the previous page. If `null` it means that the previous page is empty. */
  prev: Link | null;
  /** Link to the next page. If `null` it means that the next page is empty. */
  next: Link | null;
}

/** Common properties of all entity list page responses. */
export interface CollectionResponse {
  /** Common entity list page response links. See {@link CollectionLinks}. */
  _links: CollectionLinks;
}

/**
 * Values for return preference used in `Prefer` header. The header value is formed by joining
 * `return=` and the enum value.
 */
export enum PreferReturn {
  /** Instructs the server to return minimal entity representation. */
  Minimal = "minimal",
  /** Instructs the server to return full entity representation. */
  Representation = "representation"
}

/** Application information. */
export interface Application {
  /** Application id. */
  id: string;
  /** Application name. */
  name: string;
}
