/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, iModelScopedOperationParams } from "../../base";

// first default value: 1
// last default value: [last]
// {last: 5} downloads all until 5
// {first: 5}downloads all from 5
// {} downloads all
// {first: 5, last: 5} // downloads single changeset
export interface GetChangesetListUrlParams extends CollectionRequestParams {
  first?: number; // TODO: name tbd
  last?: number; // TODO: name tbd
}

export interface GetChangesetListParams extends iModelScopedOperationParams {
  urlParams?: GetChangesetListUrlParams;
}

export interface GetChangesetByIdParams extends iModelScopedOperationParams {
  changesetId: string;
}
