/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { join } from "path";

import {
  AcquireNewBriefcaseIdArg, BackendHubAccess, BriefcaseDbArg, BriefcaseIdArg, BriefcaseLocalValue, ChangesetArg,
  ChangesetRangeArg, CheckpointArg, CheckpointProps, CreateNewIModelProps, DownloadChangesetArg, DownloadChangesetRangeArg,
  IModelDb, IModelHost, IModelIdArg, IModelJsFs, IModelNameArg, ITwinIdArg, LockMap, LockProps, SnapshotDb, TokenArg, V2CheckpointAccessProps
} from "@itwin/core-backend";
import { BriefcaseStatus, Guid, GuidString, IModelStatus, Logger, OpenMode } from "@itwin/core-bentley";
import {
  BriefcaseId, BriefcaseIdValue, ChangesetFileProps, ChangesetIndex, ChangesetIndexAndId, ChangesetProps, IModelError,
  IModelVersion
} from "@itwin/core-common";
import { downloadFile } from "@itwin/imodels-client-authoring/lib/operations";
import axios, { AxiosResponse } from "axios";

import {
  AcquireBriefcaseParams, AuthorizationCallback, AuthorizationParam, Briefcase, Changeset, ChangesetIdOrIndex,
  ChangesetOrderByProperty, Checkpoint, ContainerAccessInfo, CreateChangesetParams, CreateIModelFromBaselineParams,
  DeleteIModelParams, DownloadChangesetListParams, DownloadSingleChangesetParams, DownloadedChangeset,
  EntityListIterator, GetBriefcaseListParams, GetChangesetListParams, GetIModelListParams, GetLockListParams,
  GetNamedVersionListParams, GetSingleChangesetParams, GetSingleCheckpointParams, IModel, IModelScopedOperationParams, IModelsClient, IModelsErrorCode,
  Lock, LockLevel, LockedObjects, MinimalChangeset, MinimalIModel, MinimalNamedVersion,
  OrderByOperator, ReleaseBriefcaseParams, SPECIAL_VALUES_ME, UpdateLockParams, isIModelsApiError, take, toArray
} from "@itwin/imodels-client-authoring";

import { AccessTokenAdapter } from "./interface-adapters/AccessTokenAdapter";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class BackendIModelsAccess implements BackendHubAccess {
  protected readonly _iModelsClient: IModelsClient;
  private readonly _changeSet0 = { id: "", changesType: 0, description: "initialChangeset", parentId: "", briefcaseId: 0, pushDate: "", userCreated: "", index: 0, size: 0 };

  constructor(iModelsClient?: IModelsClient) {
    this._iModelsClient = iModelsClient ?? new IModelsClient();
  }

  public async downloadChangesets(arg: DownloadChangesetRangeArg): Promise<ChangesetFileProps[]> {
    const downloadParams: DownloadChangesetListParams = {
      ...this.getIModelScopedOperationParams(arg),
      targetDirectoryPath: arg.targetDir
    };
    downloadParams.urlParams = PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    const [progressCallback, abortSignal] = PlatformToClientAdapter.toProgressCallback(arg.progressCallback) ?? [];
    downloadParams.progressCallback = progressCallback;
    downloadParams.abortSignal = abortSignal;

    let downloadedChangesets: DownloadedChangeset[] = [];
    try {
      downloadedChangesets = await this._iModelsClient.changesets.downloadList(downloadParams);
    } catch (error: unknown) {
      throw ClientToPlatformAdapter.toChangesetDownloadAbortedError(error);
    }
    const result: ChangesetFileProps[] = downloadedChangesets.map(ClientToPlatformAdapter.toChangesetFileProps);
    return result;
  }

  public async downloadChangeset(arg: DownloadChangesetArg): Promise<ChangesetFileProps> {
    const downloadSingleChangesetParams: DownloadSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset),
      targetDirectoryPath: arg.targetDir
    };

    const [progressCallback, abortSignal] = PlatformToClientAdapter.toProgressCallback(arg.progressCallback) ?? [];
    downloadSingleChangesetParams.progressCallback = progressCallback;
    downloadSingleChangesetParams.abortSignal = abortSignal;

    let downloadedChangeset: DownloadedChangeset | undefined;
    try {
      downloadedChangeset = await this._iModelsClient.changesets.downloadSingle(downloadSingleChangesetParams);
    } catch (error: unknown) {
      throw ClientToPlatformAdapter.toChangesetDownloadAbortedError(error);
    }
    const result: ChangesetFileProps = ClientToPlatformAdapter.toChangesetFileProps(downloadedChangeset);
    return result;
  }

  public async queryChangeset(arg: ChangesetArg): Promise<ChangesetProps> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset)
    };

    const changeset: Changeset = await this._iModelsClient.changesets.getSingle(getSingleChangesetParams);
    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async queryChangesets(arg: ChangesetRangeArg): Promise<ChangesetProps[]> {
    const iModelOperationParams: GetChangesetListParams = this.getIModelScopedOperationParams(arg);
    iModelOperationParams.urlParams = PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    const changesetsIterator: EntityListIterator<Changeset> = this._iModelsClient.changesets.getRepresentationList(iModelOperationParams);
    const changesets: Changeset[] = await toArray(changesetsIterator);
    const result: ChangesetProps[] = changesets.map(ClientToPlatformAdapter.toChangesetProps);
    return result;
  }

  public async pushChangeset(arg: IModelIdArg & { changesetProps: ChangesetFileProps }): Promise<ChangesetIndex> {
    let changesetDescription = arg.changesetProps.description;
    if (changesetDescription.length >= 255) {
      Logger.logWarning("BackendIModelsAccess", `pushChangeset - Truncating description to 255 characters. ${changesetDescription}`);
      changesetDescription = changesetDescription.slice(0, 254);
    }

    const createChangesetParams: CreateChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      changesetProperties: PlatformToClientAdapter.toChangesetPropertiesForCreate(arg.changesetProps, changesetDescription)
    };

    const createdChangeset: Changeset = await this._iModelsClient.changesets.create(createChangesetParams);
    return createdChangeset.index;
  }

  public async getLatestChangeset(arg: IModelIdArg): Promise<ChangesetProps> {
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
    if (changesets.length === 0)
      return this._changeSet0;
    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changesets[0]);
    return result;
  }

  public async getChangesetFromVersion(arg: IModelIdArg & { version: IModelVersion }): Promise<ChangesetProps> {
    const version = arg.version;
    if (version.isFirst)
      return this._changeSet0;

    const namedVersionChangesetId = version.getAsOfChangeSet();
    if (namedVersionChangesetId)
      return this.queryChangeset({ ...arg, changeset: { id: namedVersionChangesetId } });

    const namedVersionName = version.getName();
    if (namedVersionName)
      return this.getChangesetFromNamedVersion({ ...arg, versionName: namedVersionName });

    return this.getLatestChangeset(arg);
  }

  public async getChangesetFromNamedVersion(arg: IModelIdArg & { versionName: string }): Promise<ChangesetProps> {
    const iModelOperationParams: IModelScopedOperationParams = this.getIModelScopedOperationParams(arg);
    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...iModelOperationParams,
      urlParams: {
        name: arg.versionName
      }
    };
    const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> = this._iModelsClient.namedVersions.getMinimalList(getNamedVersionListParams);
    const namedVersions: MinimalNamedVersion[] = await toArray(namedVersionsIterator);
    if (namedVersions.length === 0 || !namedVersions[0].changesetId)
      throw new IModelError(IModelStatus.NotFound, `Named version ${arg.versionName} not found`);

    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...iModelOperationParams,
      changesetId: namedVersions[0].changesetId
    };
    const changeset: MinimalChangeset = await this._iModelsClient.changesets.getSingle(getSingleChangesetParams);
    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async acquireNewBriefcaseId(arg: AcquireNewBriefcaseIdArg): Promise<BriefcaseId> {
    const acquireBriefcaseParams: AcquireBriefcaseParams = this.getIModelScopedOperationParams(arg);

    const briefcase: Briefcase = await this._iModelsClient.briefcases.acquire(acquireBriefcaseParams);
    if (!briefcase)
      throw new IModelError(BriefcaseStatus.CannotAcquire, "Could not acquire briefcase");
    return briefcase.briefcaseId;
  }

  public async releaseBriefcase(arg: BriefcaseIdArg): Promise<void> {
    const releaseBriefcaseParams: ReleaseBriefcaseParams = {
      ...this.getIModelScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId
    };

    return this._iModelsClient.briefcases.release(releaseBriefcaseParams);
  }

  public async getMyBriefcaseIds(arg: IModelIdArg): Promise<BriefcaseId[]> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    const briefcasesIterator: EntityListIterator<Briefcase> = this._iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams);
    const briefcases: Briefcase[] = await toArray(briefcasesIterator);
    const briefcaseIds: BriefcaseId[] = briefcases.map((briefcase) => briefcase.briefcaseId);
    return briefcaseIds;
  }

  // eslint-disable-next-line deprecation/deprecation
  public async downloadV1Checkpoint(arg: CheckpointArg): Promise<ChangesetIndexAndId> {
    const checkpoint: Checkpoint | undefined = await this.queryCurrentOrPrecedingCheckpoint(arg);
    if (!checkpoint || !checkpoint._links?.download)
      throw new IModelError(BriefcaseStatus.VersionNotFound, "V1 checkpoint not found");

    const v1CheckpointSize = await this.getV1CheckpointSize(checkpoint._links.download.href);
    const [progressCallback, abortSignal] = PlatformToClientAdapter.toProgressCallback(arg.onProgress) ?? [];
    const totalDownloadCallback = progressCallback ? (downloaded: number) => progressCallback?.(downloaded, v1CheckpointSize) : undefined;

    await downloadFile({
      storage: this._iModelsClient.cloudStorage,
      url: checkpoint._links.download.href,
      localPath: arg.localFile,
      totalDownloadCallback,
      abortSignal
    });

    return { index: checkpoint.changesetIndex, id: checkpoint.changesetId };
  }

  /**
   * iModels API returns a link to a file in Azure Blob Storage. The API does not return checkpoint file size as
   * a standalone property so we query it from Azure using the method described below.
   *
   * To get the total size of the file we send a GET request to the file download url with `Range: bytes=0-0` header
   * specified which requests to get only the first byte of the file. As a response we get the first file byte in
   * the body and `Content-Range` response header which contains information about the total file size. See
   * https://docs.microsoft.com/en-us/rest/api/storageservices/get-blob#response-headers,
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range.
   *
   * The format of returned `Content-Range` header in this case is
   * `<unit> <range-start>-<range-end>/<size>`, e.g. `bytes 0-0/1253376`.
   */
  private async getV1CheckpointSize(downloadUrl: string): Promise<number> {
    const emptyRangeHeaderValue = "bytes=0-0";
    const contentRangeHeaderName = "content-range";

    const response: AxiosResponse = await axios.get(downloadUrl, { headers: { Range: emptyRangeHeaderValue } });
    const rangeHeaderValue: string = response.headers[contentRangeHeaderName];
    const rangeTotalBytesString: string = rangeHeaderValue.split("/")[1];
    const rangeTotalBytes: number = parseInt(rangeTotalBytesString, 10);

    return rangeTotalBytes;
  }

  // The imodels api does not distinguish between a v2 and a v1 checkpoint when calling getCurrentOrPrecedingCheckpoint.
  // It is possible that a preceding v2 checkpoint exists, but earlier in the timeline than the most recent v1 checkpoint. In this case we would miss out on the preceding v2 checkpoint.
  // To get around this, this function decrements the changesetIndex of the discovered checkpoint if it is not a v2 checkpoint and searches again.
  private async findLatestV2CheckpointForChangeset(arg: CheckpointProps, changesetIndex: number): Promise<ContainerAccessInfo | undefined> {
    if (changesetIndex <= 0)
      return undefined;

    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex({ index: changesetIndex })
    };

    const changeset = await this._iModelsClient.changesets.getSingle(getSingleChangesetParams);
    const checkpoint = await changeset.getCurrentOrPrecedingCheckpoint();

    if (!checkpoint)
      return undefined;

    if (checkpoint.containerAccessInfo !== null)
      return checkpoint.containerAccessInfo;

    const previousChangesetIndex = checkpoint.changesetIndex - 1;
    return this.findLatestV2CheckpointForChangeset(arg, previousChangesetIndex);
  }

  private async resolveChangesetIndexFromParamsOrQueryApi(arg: CheckpointProps): Promise<number> {
    if (arg.changeset.id === this._changeSet0.id || arg.changeset.index === this._changeSet0.index)
      return this._changeSet0.index;

    if (arg.changeset.index !== undefined)
      return arg.changeset.index;

    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      changesetId: arg.changeset.id
    };
    const changeset = await this._iModelsClient.changesets.getSingle(getSingleChangesetParams);
    return changeset.index;
  }

  private async queryCurrentOrPrecedingV2Checkpoint(arg: CheckpointProps): Promise<V2CheckpointAccessProps | undefined> {
    const changesetIndex = await this.resolveChangesetIndexFromParamsOrQueryApi(arg);
    const containerAccessInfo = await this.findLatestV2CheckpointForChangeset(arg, changesetIndex);
    if (containerAccessInfo === undefined)
      return undefined;

    return ClientToPlatformAdapter.toV2CheckpointAccessProps(containerAccessInfo);
  }

  public async queryV2Checkpoint(arg: CheckpointProps): Promise<V2CheckpointAccessProps | undefined> {
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset)
    };

    let checkpoint: Checkpoint;
    try {
      checkpoint = await this._iModelsClient.checkpoints.getSingle(getSingleCheckpointParams);
    } catch (error) {
      // Means that neither v1 nor v2 checkpoint exists
      if (isIModelsApiError(error) && error.code === IModelsErrorCode.CheckpointNotFound) {
        return arg?.allowPreceding ? this.queryCurrentOrPrecedingV2Checkpoint(arg) : undefined;
      }

      throw error;
    }

    // Means the v2 checkpoint does not exist.
    if (checkpoint.containerAccessInfo === null) {
      return arg?.allowPreceding ? this.queryCurrentOrPrecedingV2Checkpoint(arg) : undefined;
    }

    const result = ClientToPlatformAdapter.toV2CheckpointAccessProps(checkpoint.containerAccessInfo);
    return result;
  }

  public async acquireLocks(arg: BriefcaseDbArg, locks: LockMap): Promise<void> {
    const updateLockParams: UpdateLockParams = {
      ...this.getIModelScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId,
      changesetId: arg.changeset.id,
      lockedObjects: PlatformToClientAdapter.toLockedObjects(locks)
    };

    await this._iModelsClient.locks.update(updateLockParams);
  }

  public async queryAllLocks(arg: BriefcaseDbArg): Promise<LockProps[]> {
    const getLockListParams: GetLockListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId
      }
    };

    const locksIterator: EntityListIterator<Lock> = this._iModelsClient.locks.getList(getLockListParams);
    const locks: Lock[] = await toArray(locksIterator);
    if (locks.length === 0)
      return [];

    const result: LockProps[] = ClientToPlatformAdapter.toLockProps(locks[0]);
    return result;
  }

  public async releaseAllLocks(arg: BriefcaseDbArg): Promise<void> {
    const getLockListParams: GetLockListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId
      }
    };

    const locksIterator: EntityListIterator<Lock> = this._iModelsClient.locks.getList(getLockListParams);
    const locks: Lock[] = await toArray(locksIterator);
    if (locks.length === 0)
      return;

    const lock: Lock = locks[0];
    this.setLockLevelToNone(lock.lockedObjects);

    const updateLockParams: UpdateLockParams = {
      ...this.getIModelScopedOperationParams(arg),
      briefcaseId: lock.briefcaseId,
      changesetId: arg.changeset.id,
      lockedObjects: lock.lockedObjects
    };

    await this._iModelsClient.locks.update(updateLockParams);
  }

  public async queryIModelByName(arg: IModelNameArg): Promise<GuidString | undefined> {
    const getIModelListParams: GetIModelListParams = {
      ...this.getAuthorizationParam(arg),
      urlParams: {
        iTwinId: arg.iTwinId,
        name: arg.iModelName
      }
    };

    const iModelsIterator: EntityListIterator<MinimalIModel> = this._iModelsClient.iModels.getMinimalList(getIModelListParams);
    const iModels = await toArray(iModelsIterator);
    return iModels.length === 0 ? undefined : iModels[0].id;
  }

  public async createNewIModel(arg: CreateNewIModelProps): Promise<GuidString> {
    // TODO: use iModelsClient.iModels.createEmpty when it supports the `noLocks` flag.
    const baselineFilePath = this.copyAndPrepareBaselineFile(arg);
    const createIModelFromBaselineParams: CreateIModelFromBaselineParams = {
      ...this.getAuthorizationParam(arg),
      iModelProperties: {
        ...PlatformToClientAdapter.toIModelProperties(arg),
        filePath: baselineFilePath
      }
    };

    const iModel: IModel = await this._iModelsClient.iModels.createFromBaseline(createIModelFromBaselineParams);
    IModelJsFs.removeSync(baselineFilePath);
    return iModel.id;
  }

  public async deleteIModel(arg: IModelIdArg & ITwinIdArg): Promise<void> {
    const deleteIModelParams: DeleteIModelParams = this.getIModelScopedOperationParams(arg);
    return this._iModelsClient.iModels.delete(deleteIModelParams);
  }

  private getIModelScopedOperationParams(arg: IModelIdArg): IModelScopedOperationParams {
    return {
      ...this.getAuthorizationParam(arg),
      iModelId: arg.iModelId
    };
  }

  private getAuthorizationParam(tokenArg: TokenArg): AuthorizationParam {
    const authorizationCallback: AuthorizationCallback = tokenArg.accessToken
      ? AccessTokenAdapter.toAuthorizationCallback(tokenArg.accessToken)
      : this.getAuthorizationCallbackFromIModelHost();

    return {
      authorization: authorizationCallback
    };
  }

  private getAuthorizationCallbackFromIModelHost(): AuthorizationCallback {
    return async () => {
      const token = await IModelHost.getAccessToken();
      return AccessTokenAdapter.toAuthorization(token);
    };
  }

  private setLockLevelToNone(lockedObjectsForBriefcase: LockedObjects[]): void {
    for (const lockedObjects of lockedObjectsForBriefcase) {
      lockedObjects.lockLevel = LockLevel.None;
    }
  }

  private copyAndPrepareBaselineFile(arg: CreateNewIModelProps): string {
    const tempBaselineFilePath = join(IModelHost.cacheDir, `temp-baseline-${Guid.createValue()}.bim`);
    IModelJsFs.removeSync(tempBaselineFilePath);

    const baselineFilePath = arg.version0;
    if (!baselineFilePath) { // if they didn't supply a baseline file, create a blank one.
      const emptyBaseline = SnapshotDb.createEmpty(tempBaselineFilePath, { rootSubject: { name: arg.description ?? arg.iModelName } });
      emptyBaseline.saveChanges();
      emptyBaseline.close();
    } else {
      IModelJsFs.copySync(baselineFilePath, tempBaselineFilePath);
    }

    const nativeDb = IModelDb.openDgnDb({ path: tempBaselineFilePath }, OpenMode.ReadWrite);
    try {
      nativeDb.setITwinId(arg.iTwinId);
      nativeDb.saveChanges();
      // cspell:disable-next-line
      nativeDb.deleteAllTxns(); // necessary before resetting briefcaseId
      nativeDb.resetBriefcaseId(BriefcaseIdValue.Unassigned);
      nativeDb.saveLocalValue(BriefcaseLocalValue.NoLocking, arg.noLocks ? "true" : undefined);
      nativeDb.saveChanges();
    } finally {
      nativeDb.closeIModel();
    }

    return tempBaselineFilePath;
  }

  // eslint-disable-next-line deprecation/deprecation
  private async queryCurrentOrPrecedingCheckpoint(arg: CheckpointArg): Promise<Checkpoint | undefined> {
    const changesetIdOrIndex: ChangesetIdOrIndex = PlatformToClientAdapter.toChangesetIdOrIndex(arg.checkpoint.changeset);
    const getCheckpointParams: GetSingleCheckpointParams = {
      ...this.getAuthorizationParam(arg.checkpoint),
      iModelId: arg.checkpoint.iModelId,
      ...changesetIdOrIndex
    };

    if (changesetIdOrIndex.changesetIndex === 0)
      return this._iModelsClient.checkpoints.getSingle(getCheckpointParams);

    const changeset: Changeset = await this._iModelsClient.changesets.getSingle(getCheckpointParams);
    return changeset.getCurrentOrPrecedingCheckpoint();
  }
}
