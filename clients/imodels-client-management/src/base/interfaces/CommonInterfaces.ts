/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface Authorization {
  scheme: string;
  token: string;
}

export type AuthorizationCallback = () => Promise<Authorization>;

export interface AuthorizationParam {
  authorization: AuthorizationCallback;
}

export interface IModelScopedOperationParams extends AuthorizationParam {
  iModelId: string;
}

export interface CollectionRequestParams {
  $skip?: number;
  $top?: number;
}

export enum OrderByOperator {
  Ascending = "asc",
  Descending = "desc"
}

export interface OrderBy<TEntity, TProperties extends keyof TEntity> {
  property: TProperties;
  operator?: OrderByOperator;
}

export interface Link {
  href: string;
}

export interface CollectionLinks {
  self: Link;
  prev?: Link;
  next?: Link;
}

export interface CollectionResponse {
  _links: CollectionLinks;
}

export interface EntityCollectionPage<TEntity> {
  entities: TEntity[];
  next?: () => Promise<EntityCollectionPage<TEntity>>;
}

export enum PreferReturn {
  Minimal = "minimal",
  Representation = "representation"
}
