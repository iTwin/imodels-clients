/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, ChangesetOrderByProperty, EntityListIterator, GetChangesetListParams, IModelScopedOperationParams, IModelsClient, MinimalChangeset, OrderByOperator, take } from "@itwin/imodels-client-management";

import { handleAPIErrors } from "./ErrorHandlingFunctions";

export async function getLatestFullChangesetIfExists(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<Changeset | undefined> {

  return getLatestChangeset(
    (getChangesetListParams) => iModelsClient.changesets.getRepresentationList(getChangesetListParams),
    iModelScopedOperationParams
  );
}

export async function getLatestMinimalChangesetIfExists(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<MinimalChangeset | undefined> {

  return getLatestChangeset(
    (getChangesetListParams) => iModelsClient.changesets.getMinimalList(getChangesetListParams),
    iModelScopedOperationParams);
}

async function getLatestChangeset<TChangeset extends MinimalChangeset>(
  changesetQueryFunc: (params: GetChangesetListParams) => EntityListIterator<TChangeset>,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<TChangeset | undefined> {

  const getChangesetListParams: GetChangesetListParams = {
    ...iModelScopedOperationParams,
    urlParams: {
      $top: 1,
      $orderBy: {
        property: ChangesetOrderByProperty.Index,
        operator: OrderByOperator.Descending
      }
    }
  };

  const changesetsIterator: EntityListIterator<TChangeset> = changesetQueryFunc(getChangesetListParams);
  const changesets: TChangeset[] = await handleAPIErrors(
    async () => take(changesetsIterator, 1)
  );

  if (changesets.length === 0)
    return undefined;

  return changesets[0];
}
