/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelStatus } from "@itwin/core-bentley";
import { ChangesetIndexAndId, IModelError, IModelVersion } from "@itwin/core-common";
import { FrontendHubAccess, IModelApp, IModelIdArg } from "@itwin/core-frontend";
import { AuthorizationCallback, Changeset, ChangesetOrderByProperty, EntityListIterator, GetChangesetListParams, GetNamedVersionListParams,GetSingleChangesetParams, IModelScopedOperationParams, IModelsClient, MinimalChangeset, MinimalNamedVersion, NamedVersion, OrderByOperator, take, toArray } from "@itwin/imodels-client-management";
import { AccessTokenAdapter } from "./interface-adapters/AccessTokenAdapter";

export class FrontendIModelsAccess implements FrontendHubAccess {
  private readonly _emptyChangeset: ChangesetIndexAndId = { index: 0, id: "" };
  protected readonly _iModelsClient: IModelsClient;

  constructor(iModelsClient?: IModelsClient) {
    this._iModelsClient = iModelsClient ?? new IModelsClient();
  }

  private async getChangesetFromId(arg: IModelIdArg & { changeSetId: string }): Promise<ChangesetIndexAndId> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      changesetId: arg.changeSetId
    };

    const changeset: Changeset = await this._iModelsClient.changesets.getSingle(getSingleChangesetParams);
    if (!changeset)
      throw new IModelError(IModelStatus.NotFound, `Changeset ${arg.changeSetId} not found`);
    return { index: changeset.index, id: changeset.id };
  }

  public async getLatestChangeset(arg: IModelIdArg): Promise<ChangesetIndexAndId> {
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

    const changesetsIterator: EntityListIterator<MinimalChangeset> = this._iModelsClient.changesets.getMinimalList(getChangesetListParams);
    const changesets: MinimalChangeset[] = await take(changesetsIterator, 1);
    if (!changesets.length)
      return this._emptyChangeset;
    return { index: changesets[0].index, id: changesets[0].id };
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

    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        name: arg.versionName
      }
    };

    const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> = this._iModelsClient.namedVersions.getMinimalList(getNamedVersionListParams);
    const namedVersions: MinimalNamedVersion[] = await take(namedVersionsIterator, 1);
    if (namedVersions.length === 0 || !namedVersions[0].changesetId)
      throw new IModelError(IModelStatus.NotFound, `Named version ${arg.versionName} not found`);
    return { index: namedVersions[0].changesetIndex, id: namedVersions[0].changesetId };
  }

  private getIModelScopedOperationParams(arg: IModelIdArg): IModelScopedOperationParams {
    const authorizationCallback: AuthorizationCallback = arg.accessToken
      ? AccessTokenAdapter.toAuthorizationCallback(arg.accessToken)
      : this.getAuthorizationCallbackFromIModelApp();

    return {
      authorization: authorizationCallback,
      iModelId: arg.iModelId
    };
  }

  private getAuthorizationCallbackFromIModelApp(): AuthorizationCallback {
    return async () => {
      const token = await IModelApp.getAccessToken();
      return AccessTokenAdapter.toAuthorization(token);
    };
  }

  private async getChangesetFromLatestNamedVersion(arg: IModelIdArg): Promise<ChangesetIndexAndId> {
    const getNamedVersionListParams: GetNamedVersionListParams = this.getIModelScopedOperationParams(arg);
    const namedVersionsIterator: EntityListIterator<NamedVersion> = this._iModelsClient.namedVersions.getRepresentationList(getNamedVersionListParams);
    const namedVersions = await toArray(namedVersionsIterator);

    const sortedNamedVersions = namedVersions
      .map((namedVer: NamedVersion) => {
        return {
          changesetId: namedVer.changesetId,
          changesetIndex: namedVer.changesetIndex,
          createdDateTime: new Date(namedVer.createdDateTime)
        };
      })
      .sort(
        (a, b) => b.createdDateTime.getTime() - a.createdDateTime.getTime()
      );

    if (sortedNamedVersions.length === 0 || !sortedNamedVersions[0].changesetIndex || !sortedNamedVersions[0].changesetId)
      throw new IModelError(IModelStatus.NotFound, "No named versions found");

    return { index: sortedNamedVersions[0].changesetIndex, id: sortedNamedVersions[0].changesetId };
  }
}
