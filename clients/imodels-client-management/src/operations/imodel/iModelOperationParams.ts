/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, Extent, RequestContextParams, iModelScopedOperationParams } from "../../base";

export interface GetiModelListParams extends RequestContextParams {
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

export interface CreateEmptyiModelParams extends RequestContextParams {
  imodelProperties: iModelProperties;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteiModelParams extends iModelScopedOperationParams {
}
