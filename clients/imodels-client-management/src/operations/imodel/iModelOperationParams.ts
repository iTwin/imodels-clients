/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, Extent, RequestContextParam, iModelScopedOperationParams } from "../../base";

export interface GetiModelListParams extends RequestContextParam {
  urlParams: { projectId: string } & CollectionRequestParams;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetiModelByIdParams extends iModelScopedOperationParams {
}

export interface iModelProperties {
  projectId: string;
  name: string;
  description?: string;
  extent?: Extent;
}

export interface CreateEmptyiModelParams extends RequestContextParam {
  imodelProperties: iModelProperties;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteiModelParams extends iModelScopedOperationParams {
}
