/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AtLeastOneProperty, AuthorizationParam, CollectionRequestParams, ContainerTypes, Extent, HeadersParam, IModel, IModelScopedOperationParams, OrderBy } from "../../base/types";
import { ChangesetIdOrIndex } from "../OperationParamExports";

/**
 * iModel entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum IModelOrderByProperty {
  Name = "name",
  CreatedDateTime = "createdDateTime",
}

/** Url parameters supported in iModel list query. */
export interface GetIModelListUrlParams extends CollectionRequestParams {
  /** Specifies in what order should entities be returned. See {@link OrderBy}. */
  $orderBy?: OrderBy<IModel, IModelOrderByProperty>;
  /** Filters iModels for a specific iTwin. */
  iTwinId: string;
  /** Filters iModels with a specific name. */
  name?: string;
}

/** Parameters for get iModel list operation. */
export interface GetIModelListParams extends AuthorizationParam, HeadersParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams: GetIModelListUrlParams;
}

/** Parameters for get single iModel operation. */
export type GetSingleIModelParams = IModelScopedOperationParams;

/** Properties that should be specified when creating a new iModel. */
export interface IModelProperties {
  /** iTwin to which iModel will belong to. iTwinId id must not be an empty or whitespace string. */
  iTwinId: string;
  /**
   * iModel name. iModel name must be unique within the iTwin, not exceed allowed 255 characters and not be an
   * empty or whitespace string.
   */
  name: string;
  /** iModel description. iModel description must not exceed allowed 255 characters. */
  description?: string;
  /** iModel extent. See {@link Extent}. */
  extent?: Extent;
  /** iModel container types. See {@link ContainerTypes}. */
  containersEnabled?: ContainerTypes;
}

/** Parameters for create iModel operation. */
export interface CreateEmptyIModelParams extends AuthorizationParam, HeadersParam {
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
export interface CreateIModelFromTemplateParams extends AuthorizationParam, HeadersParam {
  /** Properties of the new iModel. See {@link IModelPropertiesForCreateFromTemplate}. */
  iModelProperties: IModelPropertiesForCreateFromTemplate;
  /** Time period to wait until the iModel is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

/** Base properties for clone iModel operation. */
interface IModelPropertiesForCloneBase {
  /** Id of the iTwin in which the new iModel will be created. */
  iTwinId: string;
  /** Name of the new iModel that will be created. If name is not provided, original iModel name will be used. */
  name?: string;
  /** Description of the new iModel that will be created. If description is not provided, original iModel description will be used. */
  description?: string;
  /** iModel container types. See {@link ContainerTypes}. */
  containersEnabled?: ContainerTypes;
}

/**
 * Properties that should be specified when cloning an iModel.
 * - The provided `changesetId` or `changesetIndex` specifies the latest source iModel Changeset that should be copied to the target iModel.
 * - If neither `changesetId` nor `changesetIndex` is provided, all existing source iModel Changesets are copied to the target iModel.
 * - If `changesetId: ""` or `changesetIndex: 0` is provided, no Changesets are copied to the target iModel, only the source iModel's Baseline.
 */
export type IModelPropertiesForClone = IModelPropertiesForCloneBase & Partial<ChangesetIdOrIndex>;

/** Parameters for clone iModel operation. */
export interface CloneIModelParams extends IModelScopedOperationParams, HeadersParam {
  /** Properties of the new iModel. See {@link IModelPropertiesForClone}. */
  iModelProperties: IModelPropertiesForClone;
  /** Time period to wait until the iModel is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

/**
 * Properties that should be specified when forking an iModel.
 * - The provided `changesetId` or `changesetIndex` specifies the latest source iModel Changeset that should be copied to the iModel fork.
 * - If neither `changesetId` nor `changesetIndex` is provided, all existing source iModel Changesets are copied to the iModel fork.
 * - If `changesetId: ""` or `changesetIndex: 0` is provided, no Changesets are copied to the iModel fork, only the source iModel's Baseline.
 */
export type IModelPropertiesForFork = IModelPropertiesForCloneBase & Partial<ChangesetIdOrIndex> & {
  /**
   * Option to control how Changesets are copied from the source iModel to the iModel fork. If set to `true`, Changesets will be copied
   * individually and the history will be preserved. If set to `false`, Changesets will be squashed and applied to the Baseline
   * resulting in an iModel fork without Changeset history. The default value is `false`.
   */
  preserveHistory?: boolean;
};

/** Parameters for fork iModel operation. */
export interface ForkIModelParams extends IModelScopedOperationParams, HeadersParam {
  /** Properties of the new iModel. See {@link IModelPropertiesForFork}. */
  iModelProperties: IModelPropertiesForFork;
  /** Time period to wait until the iModel fork is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

export interface EditableIModelProperties {
  /**
   * iModel name. iModel name must be unique within the iTwin, not exceed allowed 255 characters and not be an
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
