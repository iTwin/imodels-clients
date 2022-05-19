/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AtLeastOneProperty, CollectionRequestParams, IModelScopedOperationParams, NamedVersion, NamedVersionState, OrderBy } from "../../base";

/**
 * Named Versions entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum NamedVersionOrderByProperty {
  ChangesetIndex = "changesetIndex"
}

/** Url parameters supported in Named Version list query. */
export interface GetNamedVersionListUrlParams extends CollectionRequestParams {
  /** Specifies in what order should entities be returned. See {@link OrderBy}. */
  $orderBy?: OrderBy<NamedVersion, NamedVersionOrderByProperty>;
  /** Filters Named Versions with a specific name. */
  name?: string;
}

/** Parameters for get Named Version list operation. */
export interface GetNamedVersionListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: GetNamedVersionListUrlParams;
}

/** Parameters for get single Named Version operation. */
export interface GetSingleNamedVersionParams extends IModelScopedOperationParams {
  /** Named Version id. */
  namedVersionId: string;
}

/** Properties that should be specified when creating a new Named Version. */
export interface NamedVersionPropertiesForCreate {
  /**
   * Named Version name. Named Version name must be unique within the iModel, not exceed allowed 255 characters and not
   * be an empty or whitespace string.
   */
  name: string;
  /** Named Version description. Named Version description must not exceed allowed 255 characters. */
  description?: string;
  /**
   * Changeset id to create the Named Version on. If specified Changeset id must not be an empty or whitespace string.
   * If not specified Named Version will be created on iModel baseline (before any Changesets).
   */
  changesetId?: string;
}

/** Parameters for create Named Version operation. */
export interface CreateNamedVersionParams extends IModelScopedOperationParams {
  /** Properties of the Named Version. */
  namedVersionProperties: NamedVersionPropertiesForCreate;
}

/** Named Version properties that can be updated. */
export interface EditableNamedVersionProperties {
  /**
   * Named Version name. Named Version name must be unique within the iModel, not exceed allowed 255 characters and not
   * be an empty or whitespace string.
   */
  name: string;
  /** Named Version description. Named Version description must not exceed allowed 255 characters. */
  description: string;
  /**
   * Named Version state. This property indicates whether or not this Named Version should be displayed in
   * applications that show full Named Version list to end users. Setting the value to `NamedVersionState.Hidden` does
   * not remove this Named Version from the Named Version list returned by the API. See {@link NamedVersionState}.
   */
  state: NamedVersionState;
}

/**
 * Properties that can be specified when updating a Named Version. At least one of the editable properties should
 * be specified.
 */
export type NamedVersionPropertiesForUpdate = AtLeastOneProperty<EditableNamedVersionProperties>;

/** Parameters for update Named Version operation. */
export interface UpdateNamedVersionParams extends IModelScopedOperationParams {
  /** Id of the Named Version to update. */
  namedVersionId: string;
  /** New values for some of the Named Version properties. */
  namedVersionProperties: NamedVersionPropertiesForUpdate;
}
