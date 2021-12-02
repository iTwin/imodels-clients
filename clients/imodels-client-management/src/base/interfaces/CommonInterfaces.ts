/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Request authorization data. This data is sent to the server in `Authorization` request header, the header value formatted by joining `scheme` and `token` properties with a single space. */
export interface Authorization {
  /** Authentication scheme. Currently the iModels API supports only `Bearer` authentication scheme. */
  scheme: string;
  /** User access token. */
  token: string;
}

/** Interface for a function that returns authorization data. It is up to the user of this library to implement authentication data retrieval and pass that function as an argument into all specific operation functions. This function will be called everytime a request is sent to the API meaning that it can be called more than once during a single operation execution. See {@link Authorization}. */
export type AuthorizationCallback = () => Promise<Authorization>;

/** Authorization information parameter. This interface is extended by all other specific operation parameter interfaces. */
export interface AuthorizationParam {
  /** Function that returns valid authorization data. See {@link AuthorizationCallback}. */
  authorization: AuthorizationCallback;
}

/** Common parameters for iModel scoped operations. All operations exposed in this client are iModel scoped except for {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels}. */
export interface iModelScopedOperationParams extends AuthorizationParam {
  /** iModel id. */
  imodelId: string;
}

/** Common url parameters that are supported for all collection requests. */
export interface CollectionRequestParams {
  /** Specifies how many items should be skipped in the collection page returned by the API. The value must not exceed 1000. The default value is 100. */
  $skip?: number;
  /** Specifies how many items should be in the collection page returned by the API. The value must not exceed 1000. The default value is 100.*/
  $top?: number;
}

/** Collection ordering operators that are supported in $orderBy url parameter. */
export enum OrderByOperator {
  /**  */
  Ascending = "asc",
  Descending = "desc"
}

/** Generic interface for $orderBy url parameter. This url parameter is supported in some of the collection requests and describes in what order should the items be returned. This structured object is later formatted into a string when appending it to url by joining `property` and `operator` with a single space. */
export interface OrderBy<TEntity, TProperties extends keyof TEntity> {
  /** Entity property that should be compared when ordering elements. */
  property: TProperties;
  /** Operator that should be used for ordering. If not specified the API will return items in ascending order. See {@link OrderByOperator}. */
  operator?: OrderByOperator;
}

/** Link to some other entity or entity collection that is related to the main entity in API response. */
export interface Link {
  /** Url to access the related entity. */
  href: string;
}

/** Links that are included in all collection page responses. They simplify pagination implementation because users can send requests using these urls that already include pagination url parameters without having to manually keep track of queried entity count. */
export interface CollectionLinks {
  /** Link to the current page. */
  self: Link;
  /** Link to the previous page. If null it means that the previous page is emtpy. */
  prev: Link | null;
  /** Link to the next page. If null it means that the next page is emtpy. */
  next: Link | null;
}

/** Common properties for all collection page responses. */
export interface CollectionResponse {
  /** Common collection page response links. See {@link CollectionLinks}. */
  _links: CollectionLinks;
}

/** Partial `Prefer` request header value. The value is sent to the server in `Prefer` request header, the header value is formed by joinin `return=` and the enum value. */
export enum PreferReturn {
  /** Instructs the server to return minimal entity representation. */
  Minimal = "minimal",
  /** Instructs the server to return full entity representation. */
  Representation = "representation"
}
