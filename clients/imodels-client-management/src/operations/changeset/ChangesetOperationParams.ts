/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, CollectionRequestParams, iModelScopedOperationParams, OrderBy } from "../../base";

export enum ChangesetProps {
  Index = "index"
}

export interface GetChangesetListUrlParams extends CollectionRequestParams {
  $orderBy?: OrderBy<Changeset, ChangesetProps>;
  afterIndex?: number;
  lastIndex?: number;
}

export interface GetChangesetListParams extends iModelScopedOperationParams {
  urlParams?: GetChangesetListUrlParams;
}

export interface GetChangesetByIdParams extends iModelScopedOperationParams {
  changesetId: string;
}
