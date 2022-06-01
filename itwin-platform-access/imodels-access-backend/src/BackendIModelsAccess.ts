/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { join } from "path";

import {
  AcquireNewBriefcaseIdArg, BackendHubAccess, BriefcaseDbArg, BriefcaseIdArg, BriefcaseLocalValue, ChangesetArg,
  ChangesetRangeArg, CheckpointArg, CheckpointProps, CreateNewIModelProps, IModelDb, IModelHost, IModelIdArg, IModelJsFs,
  IModelNameArg, ITwinIdArg, LockMap, LockProps, SnapshotDb, TokenArg, V2CheckpointAccessProps
} from "@itwin/core-backend";
import { BriefcaseStatus, Guid, GuidString, IModelStatus, Logger, OpenMode } from "@itwin/core-bentley";
import {
  BriefcaseId, BriefcaseIdValue, ChangesetFileProps, ChangesetIndex, ChangesetIndexAndId, ChangesetProps, IModelError,
  IModelVersion, LocalDirName
} from "@itwin/core-common";

import {
  AcquireBriefcaseParams, AuthorizationCallback, AuthorizationParam, Briefcase, Changeset, ChangesetIdOrIndex,
  ChangesetOrderByProperty, Checkpoint, CreateChangesetParams, CreateIModelFromBaselineParams, DeleteIModelParams,
  DownloadChangesetListParams, DownloadSingleChangesetParams, DownloadedChangeset, EntityListIterator,
  GetBriefcaseListParams, GetChangesetListParams, GetIModelListParams, GetLockListParams, GetNamedVersionListParams,
  GetSingleChangesetParams, GetSingleCheckpointParams, IModel, IModelScopedOperationParams, IModelsClient, IModelsErrorCode, Lock,
  LockLevel, LockedObjects, MinimalChangeset, MinimalIModel, MinimalNamedVersion, OrderByOperator,
  ProgressCallback, ProgressData, ReleaseBriefcaseParams, SPECIAL_VALUES_ME, UpdateLockParams, isIModelsApiError, take, toArray
} from "@itwin/imodels-client-authoring";

import { AccessTokenAdapter } from "./interface-adapters/AccessTokenAdapter";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class BackendIModelsAccess implements BackendHubAccess {
  protected readonly _iModelsClient: IModelsClient;
  private readonly _changeSet0 = { id: "", changesType: 0, description: "initialChangeset", parentId: "", briefcaseId: 0, pushDate: "", userCreated: "", index: 0 };

  constructor(iModelsClient?: IModelsClient) {
    this._iModelsClient = iModelsClient ?? new IModelsClient();
  }

  public async downloadChangesets(arg: ChangesetRangeArg & { targetDir: LocalDirName }): Promise<ChangesetFileProps[]> {
    const downloadParams: DownloadChangesetListParams = {
      ...this.getIModelScopedOperationParams(arg),
      targetDirectoryPath: arg.targetDir
    };
    downloadParams.urlParams = PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    const downloadedChangesets: DownloadedChangeset[] = await this._iModelsClient.changesets.downloadList(downloadParams);
    const result: ChangesetFileProps[] = downloadedChangesets.map(ClientToPlatformAdapter.toChangesetFileProps);
    return result;
  }

  public async downloadChangeset(arg: ChangesetArg & { targetDir: LocalDirName }): Promise<ChangesetFileProps> {
    const downloadSingleChangesetParams: DownloadSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset),
      targetDirectoryPath: arg.targetDir
    };

    const downloadedChangeset: DownloadedChangeset = await this._iModelsClient.changesets.downloadSingle(downloadSingleChangesetParams);
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

  public async downloadV1Checkpoint(arg: CheckpointArg): Promise<ChangesetIndexAndId> {
    const checkpoint: Checkpoint | undefined = await this.queryCurrentOrPrecedingCheckpoint(arg);
    if (!checkpoint || !checkpoint._links?.download)
      throw new IModelError(BriefcaseStatus.VersionNotFound, "V1 checkpoint not found");

    let progressCallback: ProgressCallback | undefined;
    if (arg.onProgress)
      progressCallback = (progress: ProgressData) => arg.onProgress!(progress.bytesTransferred, progress.bytesTotal);

    await this._iModelsClient.fileHandler.downloadFile({ downloadUrl: checkpoint._links.download.href, targetFilePath: arg.localFile, progressCallback });
    return { index: checkpoint.changesetIndex, id: checkpoint.changesetId };
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
      if (isIModelsApiError(error) && error.code === IModelsErrorCode.CheckpointNotFound)
        return undefined;

      throw error;
    }

    if (checkpoint.containerAccessInfo === null)
      // Means that v2 checkpoint does not exist
      return undefined;

    const result = ClientToPlatformAdapter.toV2CheckpointAccessProps(checkpoint.containerAccessInfo);
    return result;
  }

  public async downloadV2Checkpoint(arg: CheckpointArg): Promise<ChangesetIndexAndId> {
    const checkpoint: Checkpoint | undefined = await this.queryCurrentOrPrecedingCheckpoint(arg);
    if (!checkpoint || !checkpoint.containerAccessInfo)
      throw new IModelError(IModelStatus.NotFound, "V2 checkpoint not found");

    const v2CheckpointAccessProps = ClientToPlatformAdapter.toV2CheckpointAccessProps(checkpoint.containerAccessInfo);

    const transfer = new IModelHost.platform.CloudDbTransfer("download", {
      ...v2CheckpointAccessProps,
      writeable: false,
      localFile: arg.localFile
    });

    let timer: NodeJS.Timeout | undefined;
    try {
      let total = 0;
      const onProgress = arg.onProgress;
      if (onProgress) {
        timer = setInterval(async () => { // set an interval timer to show progress every 250ms
          const progress = transfer.getProgress();
          total = progress.total;
          if (onProgress(progress.loaded, progress.total))
            transfer.cancelTransfer();
        }, 250);
      }
      await transfer.promise;
      onProgress?.(total, total); // make sure we call progress func one last time when download completes
    } catch (err: unknown) {
      throw ((err as Error)?.message === "cancelled") ? new IModelError(BriefcaseStatus.DownloadCancelled, "download cancelled") : err;
    } finally {
      if (timer)
        clearInterval(timer);
    }
    return { index: checkpoint.changesetIndex, id: checkpoint.changesetId };
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
        projectId: arg.iTwinId,
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
