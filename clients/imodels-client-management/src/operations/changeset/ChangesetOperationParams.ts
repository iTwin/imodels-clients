/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, CollectionRequestParams, OrderBy, IModelScopedOperationParams } from "../../base";

export enum ChangesetOrderByProperty {
  Index = "index"
}

export interface GetChangesetListUrlParams extends CollectionRequestParams {
  $orderBy?: OrderBy<Changeset, ChangesetOrderByProperty>;
  afterIndex?: number;
  lastIndex?: number;
}

export interface GetChangesetListParams extends IModelScopedOperationParams {
  urlParams?: GetChangesetListUrlParams;
}

interface ChangesetIdParam {
  changesetId: string;
  changesetIndex?: never;
}

interface ChangesetIndexParam {
  changesetId?: never;
  changesetIndex: number;
}

export type ChangesetIdOrIndex = ChangesetIdParam | ChangesetIndexParam;

export type GetSingleChangesetParams = IModelScopedOperationParams & ChangesetIdOrIndex;
