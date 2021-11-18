/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BentleyError, BentleyStatus } from "@itwin/core-bentley";
import { ChangesetId, IModelVersion } from "@itwin/core-common";
import { FrontendHubAccess, IModelApp, IModelIdArg } from "@itwin/core-frontend";
import { AuthorizationCallback, ChangesetOrderByProperty, GetChangesetListParams, GetNamedVersionListParams, MinimalChangeset, MinimalNamedVersion, OrderByOperator, iModelScopedOperationParams, iModelsClient, toArray } from "@itwin/imodels-client-management";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class FrontendiModelsAccess implements FrontendHubAccess {
  private readonly _emptyChangesetId = "";
  protected readonly _imodelsClient: iModelsClient;

  constructor(imodelsClient?: iModelsClient) {
    this._imodelsClient = imodelsClient ?? new iModelsClient();
  }

  public getChangesetIdFromVersion(arg: IModelIdArg & { version: IModelVersion }): Promise<ChangesetId> {
    const version = arg.version;
    if (version.isFirst)
      return Promise.resolve(this._emptyChangesetId);

    const namedVersionChangesetId = version.getAsOfChangeSet();
    if (namedVersionChangesetId)
      return Promise.resolve(namedVersionChangesetId);

    const namedVersionName = version.getName();
    if (namedVersionName)
      return this.getChangesetIdFromNamedVersion({ ...arg, versionName: namedVersionName });

    return this.getLatestChangesetId(arg);
  }

  public async getLatestChangesetId(arg: IModelIdArg): Promise<ChangesetId> {
    const getChangesetListParams: GetChangesetListParams = {
      ...this.getiModelScopedOperationParams(arg),
      urlParams: {
        $top: 1,
        $orderBy: {
          property: ChangesetOrderByProperty.Index,
          operator: OrderByOperator.Descending
        }
      }
    };

    const changesetsIterator: AsyncIterableIterator<MinimalChangeset> = this._imodelsClient.Changesets.getMinimalList(getChangesetListParams);
    const changesets: MinimalChangeset[] = await toArray(changesetsIterator);
    const result = changesets.length === 0
      ? this._emptyChangesetId
      : changesets[0].id;
    return result;
  }

  public async getChangesetIdFromNamedVersion(arg: IModelIdArg & { versionName: string }): Promise<ChangesetId> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...this.getiModelScopedOperationParams(arg),
      urlParams: {
        name: arg.versionName
      }
    };

    const namedVersionsIterator: AsyncIterableIterator<MinimalNamedVersion> = this._imodelsClient.NamedVersions.getMinimalList(getNamedVersionListParams);
    const namedVersions: MinimalNamedVersion[] = await toArray(namedVersionsIterator);
    if (namedVersions.length === 0 || !namedVersions[0].changesetId)
      throw new BentleyError(BentleyStatus.ERROR, `Named version ${arg.versionName} not found`);
    return namedVersions[0].changesetId;
  }

  private getiModelScopedOperationParams(arg: IModelIdArg): iModelScopedOperationParams {
    const authorizationCallback: AuthorizationCallback = arg.accessToken
      ? PlatformToClientAdapter.toAuthorizationCallback(arg.accessToken)
      : this.getAuthorizationCallbackFromiModelApp();

    return {
      authorization: authorizationCallback,
      imodelId: arg.iModelId
    };
  }

  private getAuthorizationCallbackFromiModelApp(): AuthorizationCallback {
    return () => IModelApp.getAccessToken().then(PlatformToClientAdapter.toAuthorization);
  }
}
