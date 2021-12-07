/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelStatus } from "@itwin/core-bentley";
import { ChangesetId, IModelError, IModelVersion } from "@itwin/core-common";
import { FrontendHubAccess, IModelApp, IModelIdArg } from "@itwin/core-frontend";
import { AuthorizationCallback, ChangesetOrderByProperty, GetChangesetListParams, GetNamedVersionListParams, IModelScopedOperationParams, IModelsClient, MinimalChangeset, MinimalNamedVersion, OrderByOperator, take } from "@itwin/imodels-client-management";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class FrontendIModelsAccess implements FrontendHubAccess {
  private readonly _emptyChangesetId = "";
  protected readonly _iModelsClient: IModelsClient;

  constructor(iModelsClient?: IModelsClient) {
    this._iModelsClient = iModelsClient ?? new IModelsClient();
  }

  public async getChangesetIdFromVersion(arg: IModelIdArg & { version: IModelVersion }): Promise<ChangesetId> {
    const version = arg.version;
    if (version.isFirst)
      return this._emptyChangesetId;

    const namedVersionChangesetId = version.getAsOfChangeSet();
    if (namedVersionChangesetId)
      return namedVersionChangesetId;

    const namedVersionName = version.getName();
    if (namedVersionName)
      return this.getChangesetIdFromNamedVersion({ ...arg, versionName: namedVersionName });

    return this.getLatestChangesetId(arg);
  }

  public async getLatestChangesetId(arg: IModelIdArg): Promise<ChangesetId> {
    const getChangesetListParams: GetChangesetListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        $top: 1,
        $orderBy: {
          property: ChangesetOrderByProperty.Index,
          operator: OrderByOperator.Descending
        }
      }
    };

    const changesetsIterator: AsyncIterableIterator<MinimalChangeset> = this._iModelsClient.changesets.getMinimalList(getChangesetListParams);
    const changesets: MinimalChangeset[] = await take(changesetsIterator, 1);
    const result = changesets.length === 0
      ? this._emptyChangesetId
      : changesets[0].id;
    return result;
  }

  public async getChangesetIdFromNamedVersion(arg: IModelIdArg & { versionName: string }): Promise<ChangesetId> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        name: arg.versionName
      }
    };

    const namedVersionsIterator: AsyncIterableIterator<MinimalNamedVersion> = this._iModelsClient.namedVersions.getMinimalList(getNamedVersionListParams);
    const namedVersions: MinimalNamedVersion[] = await take(namedVersionsIterator, 1);
    if (namedVersions.length === 0 || !namedVersions[0].changesetId)
      throw new IModelError(IModelStatus.NotFound, `Named version ${arg.versionName} not found`);
    return namedVersions[0].changesetId;
  }

  private getIModelScopedOperationParams(arg: IModelIdArg): IModelScopedOperationParams {
    const authorizationCallback: AuthorizationCallback = arg.accessToken
      ? PlatformToClientAdapter.toAuthorizationCallback(arg.accessToken)
      : this.getAuthorizationCallbackFromIModelApp();

    return {
      authorization: authorizationCallback,
      iModelId: arg.iModelId
    };
  }

  private getAuthorizationCallbackFromIModelApp(): AuthorizationCallback {
    return async () => {
      const token = await IModelApp.getAccessToken();
      return PlatformToClientAdapter.toAuthorization(token);
    };
  }
}
