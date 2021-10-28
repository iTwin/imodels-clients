/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AtLeastOneProperty, CollectionRequestParams, NamedVersionState, iModelScopedOperationParams } from "../../base";

export interface GetNamedVersionListUrlParams extends CollectionRequestParams {
  name?: string;
}

export interface GetNamedVersionListParams extends iModelScopedOperationParams {
  urlParams?: GetNamedVersionListUrlParams;
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

export interface EditableNamedVersionProperties {
  name: string;
  description: string;
  state: NamedVersionState;
}

export type NamedVersionPropertiesForUpdate = AtLeastOneProperty<EditableNamedVersionProperties>;

export interface UpdateNamedVersionParams extends iModelScopedOperationParams {
  namedVersionId: string;
  namedVersionProperties: NamedVersionPropertiesForUpdate;
}
