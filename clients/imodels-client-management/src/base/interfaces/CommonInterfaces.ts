/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface AuthorizationHeader {
  scheme: string;
  token: string;
}

export interface RequestContext {
  authorization: AuthorizationHeader;
}

export interface RequestContextParams {
  requestContext: RequestContext;
}

export interface iModelScopedOperationParams extends RequestContextParams {
  imodelId: string;
}

export interface CollectionRequestParams {
  $skip?: number;
  $top?: number;
}

export interface OrderedCollectionRequestParams extends CollectionRequestParams {
  $orderBy?: number;
}

export interface BaseEntity {
  id: string;
  displayName: string;
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
