/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, CollectionRequestParams, Extent, IModel, IModelScopedOperationParams, OrderBy } from "../../base";

export enum IModelOrderByProperty {
  Name = "name"
}

export interface GetIModelListUrlParams extends CollectionRequestParams {
  $orderBy?: OrderBy<IModel, IModelOrderByProperty>;
  projectId: string;
  name?: string;
}

export interface GetIModelListParams extends AuthorizationParam {
  urlParams: GetIModelListUrlParams;
}

export type GetSingleIModelParams = IModelScopedOperationParams;

export interface IModelProperties {
  projectId: string;
  name: string;
  description?: string;
  extent?: Extent;
}

export interface CreateEmptyIModelParams extends AuthorizationParam {
  iModelProperties: IModelProperties;
}

export type DeleteIModelParams = IModelScopedOperationParams;
