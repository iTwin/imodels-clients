/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, CollectionRequestParams, IModelScopedOperationParams, OrderBy } from "../../base";

/**
 * Changeset entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum ChangesetOrderByProperty {
  Index = "index"
}

/** Url parameters supported in Changeset list query. */
export interface GetChangesetListUrlParams extends CollectionRequestParams {
  /** Specifies in what order should entities be returned. See {@link OrderBy}. */
  $orderBy?: OrderBy<Changeset, ChangesetOrderByProperty>;
  /**
   * Filters Changesets which have an index greater than specified in `afterIndex` property. For example,
   * `afterIndex: 5` will return all Changesets that have an index equal or greater than 6. This option can be
   * combined with {@link GetChangesetListUrlParams.lastIndex} option to query a specific Changeset range.
   */
  afterIndex?: number;
  /** Filters Changesets which have an index less than or equal than specified in `lastIndex` property. For example,
   * `lastIndex: 10` will return all Changesets that have an index less than or equal to 10. This option can be
   * combined with {@link GetChangesetListUrlParams.afterIndex} option to query a specific Changeset range.
   */
  lastIndex?: number;
}

/** Parameters for get Changeset list operation. */
export interface GetChangesetListParams extends IModelScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
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

/**
 * Supported Changeset identifiers. Only one of the following properties can be specified to identify
 * a single Changeset: `changesetId`, `changesetIndex`.
 */
export type ChangesetIdOrIndex = ChangesetIdParam | ChangesetIndexParam;

/** Parameters for get single Changeset operation. */
export type GetSingleChangesetParams = IModelScopedOperationParams & ChangesetIdOrIndex;
