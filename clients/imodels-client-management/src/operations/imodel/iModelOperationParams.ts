/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, CollectionRequestParams, Extent, OrderBy, iModel, iModelScopedOperationParams } from "../../base";

/** iModel entity properties that are supported in $orderBy url parameter which specifies by what property items are ordered in a collection. */
export enum iModelOrderByProperty {
  Name = "name"
}

/** Url parameters supported in iModels list query. */
export interface GetiModelListUrlParams extends CollectionRequestParams {
  /** Specifies in what order should the items be returned. See {@link OrderBy}. */
  $orderBy?: OrderBy<iModel, iModelOrderByProperty>;
  /** Filters iModels for a specific project. */
  projectId: string;
  /** Filters iModels with a specific name. */
  name?: string;
}

/** Parameters for iModels list query operation. */
export interface GetiModelListParams extends AuthorizationParam {
  /** Parameters that will be appended to the entity list request url that will narrow down or alter the results. */
  urlParams: GetiModelListUrlParams;
}

/** Parameters for single iModel query operation. */
export type GetSingleiModelParams = iModelScopedOperationParams;

/** Properties that should be specified when creating a new iModel. */
export interface iModelProperties {
  /** Project for which the iModel belongs. Project id must not be empty or whitespace string. */
  projectId: string;
  /** iModel name. iModel name must be unique within the project, not exceed allowed 255 characters and not be an empty or whitespace string. */
  name: string;
  /** iModel description. iModel description must not exceed allowed 255 characters. */
  description?: string;
  /** iModel extent. See {@link Extent}. */
  extent?: Extent;
}

/** Parameters for iModel create operation. */
export interface CreateEmptyiModelParams extends AuthorizationParam {
  /** Properties for the new iModel. */
  imodelProperties: iModelProperties;
}

/** Parameters for iModel delete operation. */
export type DeleteiModelParams = iModelScopedOperationParams;
