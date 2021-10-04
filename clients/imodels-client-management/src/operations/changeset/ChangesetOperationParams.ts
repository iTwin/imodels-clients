/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelScopedOperationParams, OrderedCollectionRequestParams } from "../../base";

export interface GetChangesetListUrlParams extends OrderedCollectionRequestParams {
  afterIndex?: number;
  lastIndex?: number;
}

export interface GetChangesetListParams extends iModelScopedOperationParams {
  urlParams?: GetChangesetListUrlParams;
}

export interface GetChangesetByIdParams extends iModelScopedOperationParams {
  changesetId: string;
}
