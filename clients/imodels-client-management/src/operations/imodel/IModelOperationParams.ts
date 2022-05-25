/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AtLeastOneProperty, AuthorizationParam, CollectionRequestParams, Extent, IModel, IModelScopedOperationParams, OrderBy } from "../../base";

/**
 * iModel entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum IModelOrderByProperty {
  Name = "name"
}

/** Url parameters supported in iModel list query. */
export interface GetIModelListUrlParams extends CollectionRequestParams {
  /** Specifies in what order should entities be returned. See {@link OrderBy}. */
  $orderBy?: OrderBy<IModel, IModelOrderByProperty>;
  /** Filters iModels for a specific project. */
  projectId: string;
  /** Filters iModels with a specific name. */
  name?: string;
}

/** Parameters for get iModel list operation. */
export interface GetIModelListParams extends AuthorizationParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
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
  /** Properties of the new iModel. See {@link IModelProperties}. */
  iModelProperties: IModelProperties;
}

/** A set of properties that define the source iModel for creating a new iModel from template. */
export interface IModelTemplate {
  /** Id of the source iModel which to use as a template. iModel id must not be an empty or whitespace string.*/
  iModelId: string;
  /**
   * iModel timeline point identified by the Changeset. If specified, all Changesets up to and including the one
   * specified will me merged into the resulting iModel baseline file. It means that the Changeset history will
   * be lost but the contents will be present in the result iModel baseline file.
   */
  changesetId?: string;
}

/** Properties that should be specified when creating a new iModel from template. */
export interface IModelPropertiesForCreateFromTemplate extends IModelProperties {
  /** iModel template. See {@link IModelTemplate}. */
  template: IModelTemplate;
}

/** Parameters for create iModel from template operation. */
export interface CreateIModelFromTemplateParams extends AuthorizationParam {
  /** Properties of the new iModel. See {@link IModelPropertiesForCreateFromTemplate}. */
  iModelProperties: IModelPropertiesForCreateFromTemplate;
  /** Time period to wait until the iModel is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

export interface EditableIModelProperties {
  /**
   * iModel name. iModel name must be unique within the project, not exceed allowed 255 characters and not be an
   * empty or whitespace string.
   */
  name: string;
  /** iModel description. iModel description must not exceed allowed 255 characters. */
  description: string;
  /** iModel extent. See {@link Extent}. */
  extent: Extent;
}

/**
 * Properties that can be specified when updating an iModel. At least one of the editable properties should
 * be specified.
 */
export type IModelPropertiesForUpdate = AtLeastOneProperty<EditableIModelProperties>;

/** Parameters for update iModel operation. */
export interface UpdateIModelParams extends IModelScopedOperationParams {
  /** New values for some of the iModel properties. */
  iModelProperties: IModelPropertiesForUpdate;
}

/** Parameters for delete iModel operation. */
export type DeleteIModelParams = IModelScopedOperationParams;
