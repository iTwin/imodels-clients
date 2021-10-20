/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, CollectionRequestParams, Extent, iModelScopedOperationParams } from "../../base";

export interface GetiModelListUrlParams extends CollectionRequestParams {
  projectId: string;
}

export interface GetiModelListParams extends AuthorizationParam {
  urlParams: GetiModelListUrlParams;
}

export type GetiModelByIdParams = iModelScopedOperationParams

export interface iModelProperties {
  projectId: string;
  name: string;
  description?: string;
  extent?: Extent;
}

export interface CreateEmptyiModelParams extends AuthorizationParam {
  imodelProperties: iModelProperties;
}

export type DeleteiModelParams = iModelScopedOperationParams
