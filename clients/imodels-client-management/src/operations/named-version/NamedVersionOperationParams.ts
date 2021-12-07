/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AtLeastOneProperty, CollectionRequestParams, IModelScopedOperationParams, NamedVersionState } from "../../base";

export interface GetNamedVersionListUrlParams extends CollectionRequestParams {
  name?: string;
}

export interface GetNamedVersionListParams extends IModelScopedOperationParams {
  urlParams?: GetNamedVersionListUrlParams;
}

export interface GetSingleNamedVersionParams extends IModelScopedOperationParams {
  namedVersionId: string;
}

export interface NamedVersionPropertiesForCreate {
  name: string;
  description?: string;
  changesetId?: string;
}

export interface CreateNamedVersionParams extends IModelScopedOperationParams {
  namedVersionProperties: NamedVersionPropertiesForCreate;
}

export interface EditableNamedVersionProperties {
  name: string;
  description: string;
  state: NamedVersionState;
}

export type NamedVersionPropertiesForUpdate = AtLeastOneProperty<EditableNamedVersionProperties>;

export interface UpdateNamedVersionParams extends IModelScopedOperationParams {
  namedVersionId: string;
  namedVersionProperties: NamedVersionPropertiesForUpdate;
}
