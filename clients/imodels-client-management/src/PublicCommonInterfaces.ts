/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface BaseEntity {
  id: string;
  displayName: string;
}

export interface AuthorizationHeader {
  scheme: string;
  credentials: string;
}

export interface RequestContext {
  authorizationHeader: AuthorizationHeader;
}

export interface RequestContextParam {
  requestContext: RequestContext;
}

export interface CollectionRequestParams {
  $skip?: number;
  $top?: number;
}
