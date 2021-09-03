/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { getPagedCollectionGenerator, OperationsBase, PreferReturn } from "../../base";
import { Changeset, MinimalChangeset } from "../../base/interfaces/apiEntities/ChangesetInterfaces";
import { GetChangesetListParams } from "./ChangesetOperationParams";

export class ChangesetOperations extends OperationsBase {
  public getMinimalList(params: GetChangesetListParams): AsyncIterableIterator<MinimalChangeset> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<MinimaliModel>({
      ...params,
      url: `${this._apiBaseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal
    }));
  }

  public getRepresentationList(params: GetChangesetListParams): AsyncIterableIterator<Changeset> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<iModel>({
      ...params,
      url: `${this._apiBaseUrl}/${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation
    }));
  }
}