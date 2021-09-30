/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, iModelScopedOperationParams, NamedVersionState } from "../../base";

export interface GetNamedVersionListParams extends iModelScopedOperationParams {
  urlParams?: CollectionRequestParams;
}

export interface GetNamedVersionByIdParams extends iModelScopedOperationParams {
  namedVersionId: string;
}

export interface NamedVersionPropertiesForCreate {
  name: string;
  description?: string;
  changesetId?: string;
}

export interface CreateNamedVersionParams extends iModelScopedOperationParams {
  namedVersionProperties: NamedVersionPropertiesForCreate;
}

export interface NamedVersionPropertiesForUpdate {
  name?: string;
  description?: string;
  state?: NamedVersionState;
}

export interface UpdateNamedVersionParams extends iModelScopedOperationParams {
  namedVersionId: string;
  namedVersionProperties: NamedVersionPropertiesForUpdate;
}