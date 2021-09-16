/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, Extent, RequestContextParams, iModelScopedOperationParams } from "../../base";

export interface GetiModelListParams extends RequestContextParams {
  urlParams: { projectId: string } & CollectionRequestParams;
}

export type GetiModelByIdParams = iModelScopedOperationParams

export interface iModelProperties {
  projectId: string;
  name: string;
  description?: string;
  extent?: Extent;
}

export interface CreateEmptyiModelParams extends RequestContextParams {
  imodelProperties: iModelProperties;
}

export type DeleteiModelParams = iModelScopedOperationParams
