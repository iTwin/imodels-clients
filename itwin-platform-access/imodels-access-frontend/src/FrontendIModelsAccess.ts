/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ITwinError } from "@itwin/core-bentley";
import { ChangesetIndexAndId, IModelVersion } from "@itwin/core-common";
import { FrontendHubAccess, IModelApp, IModelIdArg } from "@itwin/core-frontend";
import {
  AccessTokenAdapter, Constants, getLatestMinimalChangesetIfExists,
  getNamedVersionChangeset, handleAPIErrors
} from "@itwin/imodels-access-common";

import { AuthorizationCallback, Changeset, EntityListIterator, GetNamedVersionListParams, GetSingleChangesetParams, IModelScopedOperationParams, IModelsClient, IModelsErrorCode, IModelsErrorScope, MinimalNamedVersion, NamedVersionOrderByProperty, OrderByOperator, take } from "@itwin/imodels-client-management";

export class FrontendIModelsAccess implements FrontendHubAccess {
  private readonly _emptyChangeset: ChangesetIndexAndId = { index: Constants.ChangeSet0.index, id: Constants.ChangeSet0.id };
  protected readonly _iModelsClient: IModelsClient;

  constructor(iModelsClient?: IModelsClient) {
    this._iModelsClient = iModelsClient ?? new IModelsClient();
  }

  private async getChangesetFromId(arg: IModelIdArg & { changeSetId: string }): Promise<ChangesetIndexAndId> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      changesetId: arg.changeSetId
    };

    const changeset: Changeset = await handleAPIErrors(
      async () => this._iModelsClient.changesets.getSingle(getSingleChangesetParams)
    );

    if (!changeset)
      ITwinError.throwError({
        iTwinErrorId: {
          key: IModelsErrorCode.ChangesetNotFound,
          scope: IModelsErrorScope
        },
        message: `Changeset ${arg.changeSetId} not found`
      });

    return { index: changeset.index, id: changeset.id };
  }

  public async getLatestChangeset(arg: IModelIdArg): Promise<ChangesetIndexAndId> {
    const latestChangeset = await getLatestMinimalChangesetIfExists(
      this._iModelsClient,
      this.getIModelScopedOperationParams(arg)
    );

    if (!latestChangeset)
      return this._emptyChangeset;

    return { index: latestChangeset.index, id: latestChangeset.id };
  }

  public async getChangesetFromVersion(arg: IModelIdArg & { version: IModelVersion }): Promise<ChangesetIndexAndId> {
    const version = arg.version;
    if (version.isFirst)
      return this._emptyChangeset;

    const namedVersionChangesetId = version.getAsOfChangeSet();
    if (namedVersionChangesetId)
      return this.getChangesetFromId({ ...arg, changeSetId: namedVersionChangesetId });

    const namedVersionName = version.getName();
    if (namedVersionName)
      return this.getChangesetFromNamedVersion({ ...arg, versionName: namedVersionName });

    return this.getLatestChangeset(arg);
  }

  public async getChangesetFromNamedVersion(arg: IModelIdArg & { versionName?: string }): Promise<ChangesetIndexAndId> {
    if (!arg.versionName)
      return this.getChangesetFromLatestNamedVersion(arg);

    return getNamedVersionChangeset(
      this._iModelsClient,
      this.getIModelScopedOperationParams(arg),
      arg.versionName
    );
  }

  private getIModelScopedOperationParams(arg: IModelIdArg): IModelScopedOperationParams {
    const authorizationCallback: AuthorizationCallback = arg.accessToken
      ? async () => AccessTokenAdapter.toAuthorization(arg.accessToken)
      : AccessTokenAdapter.toAuthorizationCallback(IModelApp.getAccessToken);

    return {
      authorization: authorizationCallback,
      iModelId: arg.iModelId
    };
  }

  private async getChangesetFromLatestNamedVersion(arg: IModelIdArg): Promise<ChangesetIndexAndId> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        $top: 1,
        $orderBy: {
          property: NamedVersionOrderByProperty.ChangesetIndex,
          operator: OrderByOperator.Descending
        }
      }
    };
    const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> = this._iModelsClient.namedVersions.getMinimalList(getNamedVersionListParams);
    const namedVersions = await handleAPIErrors(
      async () => take(namedVersionsIterator, 1)
    );

    if (namedVersions.length === 0 || !namedVersions[0].changesetIndex || !namedVersions[0].changesetId)
      ITwinError.throwError({
        iTwinErrorId: {
          key: IModelsErrorCode.NamedVersionNotFound,
          scope: IModelsErrorScope
        },
        message: "No named versions found"
      });

    return { index: namedVersions[0].changesetIndex, id: namedVersions[0].changesetId };
  }
}
