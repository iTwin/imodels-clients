/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ITwinError } from "@itwin/core-bentley";
import {
  Changeset,
  ChangesetOrderByProperty,
  EntityListIterator,
  GetChangesetListParams,
  GetNamedVersionListParams,
  IModelScopedOperationParams,
  IModelsClient,
  IModelsErrorCode,
  IModelsErrorScope,
  MinimalChangeset,
  MinimalNamedVersion,
  OrderByOperator,
  take,
  toArray,
} from "@itwin/imodels-client-management";

import { handleAPIErrors } from "./ErrorHandlingFunctions";

export async function getLatestFullChangesetIfExists(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<Changeset | undefined> {
  return getLatestChangeset(
    (getChangesetListParams) =>
      iModelsClient.changesets.getRepresentationList(getChangesetListParams),
    iModelScopedOperationParams
  );
}

export async function getLatestMinimalChangesetIfExists(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<MinimalChangeset | undefined> {
  return getLatestChangeset(
    (getChangesetListParams) =>
      iModelsClient.changesets.getMinimalList(getChangesetListParams),
    iModelScopedOperationParams
  );
}

export async function getNamedVersionChangeset(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams,
  versionName: string
): Promise<{ id: string; index: number }> {
  const getNamedVersionListParams: GetNamedVersionListParams = {
    ...iModelScopedOperationParams,
    urlParams: {
      name: versionName,
    },
  };

  const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> =
    iModelsClient.namedVersions.getMinimalList(getNamedVersionListParams);
  const namedVersions: MinimalNamedVersion[] = await handleAPIErrors(async () =>
    toArray(namedVersionsIterator)
  );

  if (namedVersions.length === 0 || !namedVersions[0].changesetId)
    ITwinError.throwError({
      iTwinErrorId: {
        key: IModelsErrorCode.NamedVersionNotFound,
        scope: IModelsErrorScope,
      },
      message: `Named version ${versionName} not found`,
    });

  return {
    id: namedVersions[0].changesetId,
    index: namedVersions[0].changesetIndex,
  };
}

async function getLatestChangeset<TChangeset extends MinimalChangeset>(
  changesetQueryFunc: (
    params: GetChangesetListParams
  ) => EntityListIterator<TChangeset>,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<TChangeset | undefined> {
  const getChangesetListParams: GetChangesetListParams = {
    ...iModelScopedOperationParams,
    urlParams: {
      $top: 1,
      $orderBy: {
        property: ChangesetOrderByProperty.Index,
        operator: OrderByOperator.Descending,
      },
    },
  };

  const changesetsIterator: EntityListIterator<TChangeset> = changesetQueryFunc(
    getChangesetListParams
  );
  const changesets: TChangeset[] = await handleAPIErrors(async () =>
    take(changesetsIterator, 1)
  );

  if (changesets.length === 0) return undefined;

  return changesets[0];
}
