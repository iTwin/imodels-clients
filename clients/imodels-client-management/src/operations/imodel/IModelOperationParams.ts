/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, CollectionRequestParams, Extent, IModel, IModelScopedOperationParams, OrderBy } from "../../base";

/**
 * iModel entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum IModelOrderByProperty {
  Name = "name"
}

/** Url parameters supported in iModels list query. */
export interface GetIModelListUrlParams extends CollectionRequestParams {
  /** Specifies in what order should entities be returned. See {@link OrderBy}. */
  $orderBy?: OrderBy<IModel, IModelOrderByProperty>;
  /** Filters iModels for a specific project. */
  projectId: string;
  /** Filters iModels with a specific name. */
  name?: string;
}

/** Parameters for get iModels list operation. */
export interface GetIModelListParams extends AuthorizationParam {
  /** Parameters that will be appended to the entity list request url that will narrow down or alter the results. */
  urlParams: GetIModelListUrlParams;
}

/** Parameters for get single iModel operation. */
export type GetSingleIModelParams = IModelScopedOperationParams;

/** Properties that should be specified when creating a new iModel. */
export interface IModelProperties {
  /** Project which will own the iModel. Project id must not be an empty or whitespace string. */
  projectId: string;
  /**
   * iModel name. iModel name must be unique within the project, not exceed allowed 255 characters and not be an
   * empty or whitespace string.
   */
  name: string;
  /** iModel description. iModel description must not exceed allowed 255 characters. */
  description?: string;
  /** iModel extent. See {@link Extent}. */
  extent?: Extent;
}

/** Parameters for create iModel operation. */
export interface CreateEmptyIModelParams extends AuthorizationParam {
  /** Properties of the new iModel. */
  iModelProperties: IModelProperties;
}

/** Parameters for delete iModel operation. */
export type DeleteIModelParams = IModelScopedOperationParams;
