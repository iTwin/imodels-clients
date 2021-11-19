/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { join } from "path";
import { UserCancelledError } from "@bentley/itwin-client";
import {
  AcquireNewBriefcaseIdArg, BackendHubAccess, BriefcaseDbArg, BriefcaseIdArg, BriefcaseLocalValue, ChangesetArg,
  ChangesetRangeArg, CheckpointArg, CheckpointProps, CreateNewIModelProps, IModelDb, IModelHost, IModelIdArg, IModelJsFs,
  IModelNameArg, ITwinIdArg, LockMap, LockProps, SnapshotDb, TokenArg, V2CheckpointAccessProps
} from "@itwin/core-backend";
import { BriefcaseStatus, GuidString, IModelStatus, Logger, OpenMode } from "@itwin/core-bentley";
import {
  BriefcaseId, BriefcaseIdValue, ChangesetFileProps, ChangesetId, ChangesetIndex, ChangesetProps, IModelError,
  IModelVersion, LocalDirName
} from "@itwin/core-common";
import {
  AcquireBriefcaseParams, AuthorizationCallback, AuthorizationParam, Briefcase, Changeset, ChangesetIdOrIndex,
  ChangesetOrderByProperty, Checkpoint, CreateChangesetParams, CreateiModelFromBaselineParams, DeleteiModelParams,
  DownloadChangesetListParams, DownloadSingleChangesetParams, DownloadedChangeset, GetBriefcaseListParams,
  GetChangesetListParams, GetLockListParams, GetNamedVersionListParams, GetSingleChangesetParams, GetSingleCheckpointParams,
  GetiModelListParams, Lock, LockLevel, LockedObjects, MinimalChangeset, MinimalNamedVersion, MinimaliModel, OrderByOperator,
  ProgressCallback, ProgressData, ReleaseBriefcaseParams, SPECIAL_VALUES_ME, UpdateLockParams,
  iModel, iModelScopedOperationParams, iModelsClient, iModelsErrorCode, isiModelsApiError, toArray
} from "@itwin/imodels-client-authoring";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class BackendiModelsAccess implements BackendHubAccess {
  protected readonly _imodelsClient: iModelsClient;
  private readonly _changeSet0 = { id: "", changesType: 0, description: "initialChangeset", parentId: "", briefcaseId: 0, pushDate: "", userCreated: "", index: 0 };

  constructor(imodelsClient?: iModelsClient) {
    this._imodelsClient = imodelsClient ?? new iModelsClient();
  }

  public async downloadChangesets(arg: ChangesetRangeArg & { targetDir: LocalDirName; }): Promise<ChangesetFileProps[]> {
    const downloadParams: DownloadChangesetListParams = {
      ...this.getiModelScopedOperationParams(arg),
      targetDirectoryPath: arg.targetDir
    };
    if (arg.range) {
      downloadParams.urlParams = {
        afterIndex: arg.range.first - 1,
        lastIndex: arg.range.end
      };
    }

    const downloadedChangesets: DownloadedChangeset[] = await this._imodelsClient.Changesets.downloadList(downloadParams);
    const result: ChangesetFileProps[] = downloadedChangesets.map(ClientToPlatformAdapter.toChangesetFileProps);
    return result;
  }

  public async downloadChangeset(arg: ChangesetArg & { targetDir: LocalDirName; }): Promise<ChangesetFileProps> {
    const changesetIdOrIndex: ChangesetIdOrIndex = PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset);
    const downloadSingleChangesetParams: DownloadSingleChangesetParams = {
      ...this.getiModelScopedOperationParams(arg),
      ...changesetIdOrIndex,
      targetDirectoryPath: arg.targetDir
    };

    const downloadedChangeset: DownloadedChangeset = await this._imodelsClient.Changesets.downloadSingle(downloadSingleChangesetParams);
    const result: ChangesetFileProps = ClientToPlatformAdapter.toChangesetFileProps(downloadedChangeset);
    return result;
  }

  public async queryChangeset(arg: ChangesetArg): Promise<ChangesetProps> {
    const changesetIdOrIndex: ChangesetIdOrIndex = PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset);
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getiModelScopedOperationParams(arg),
      ...changesetIdOrIndex
    };

    const changeset: Changeset = await this._imodelsClient.Changesets.getSingle(getSingleChangesetParams);
    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async queryChangesets(arg: ChangesetRangeArg): Promise<ChangesetProps[]> {
    const imodelOperationParams: GetChangesetListParams = this.getiModelScopedOperationParams(arg);
    if (arg.range) {
      imodelOperationParams.urlParams = {
        afterIndex: arg.range.first - 1,
        lastIndex: arg.range.end
      };
    }

    const changesetsIterator: AsyncIterableIterator<Changeset> = this._imodelsClient.Changesets.getRepresentationList(imodelOperationParams);
    const changesets: Changeset[] = await toArray(changesetsIterator);
    const result: ChangesetProps[] = changesets.map(ClientToPlatformAdapter.toChangesetProps);
    return result;
  }

  public async pushChangeset(arg: IModelIdArg & { changesetProps: ChangesetFileProps; }): Promise<ChangesetIndex> {
    let changesetDescription = arg.changesetProps.description;
    if (changesetDescription.length >= 255) {
      Logger.logWarning("BackendiModelsAccess", `pushChangeset - Truncating description to 255 characters. ${changesetDescription}`);
      changesetDescription = changesetDescription.slice(0, 254);
    }

    const createChangesetParams: CreateChangesetParams = {
      ...this.getiModelScopedOperationParams(arg),
      changesetProperties: PlatformToClientAdapter.toChangesetPropertiesForCreate(arg.changesetProps, changesetDescription)
    };

    const createdChangeset: Changeset = await this._imodelsClient.Changesets.create(createChangesetParams);
    return createdChangeset.index;
  }

  public async getLatestChangeset(arg: IModelIdArg): Promise<ChangesetProps> {
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
    if (changesets.length === 0)
      return this._changeSet0;
    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changesets[0]);
    return result;
  }

  public async getChangesetFromVersion(arg: IModelIdArg & { version: IModelVersion; }): Promise<ChangesetProps> {
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

  public async getChangesetFromNamedVersion(arg: IModelIdArg & { versionName: string; }): Promise<ChangesetProps> {
    const imodelOperationParams: iModelScopedOperationParams = this.getiModelScopedOperationParams(arg);
    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...imodelOperationParams,
      urlParams: {
        name: arg.versionName
      }
    };
    const namedVersionsIterator: AsyncIterableIterator<MinimalNamedVersion> = this._imodelsClient.NamedVersions.getMinimalList(getNamedVersionListParams);
    const namedVersions: MinimalNamedVersion[] = await toArray(namedVersionsIterator);
    if (namedVersions.length === 0 || !namedVersions[0].changesetId)
      throw new IModelError(IModelStatus.NotFound, `Named version ${arg.versionName} not found`);

    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...imodelOperationParams,
      changesetId: namedVersions[0].changesetId
    };
    const changeset: MinimalChangeset = await this._imodelsClient.Changesets.getSingle(getSingleChangesetParams);
    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async acquireNewBriefcaseId(arg: AcquireNewBriefcaseIdArg): Promise<BriefcaseId> {
    const acquireBriefcaseParams: AcquireBriefcaseParams = this.getiModelScopedOperationParams(arg);

    const briefcase: Briefcase = await this._imodelsClient.Briefcases.acquire(acquireBriefcaseParams);
    if (!briefcase)
      throw new IModelError(BriefcaseStatus.CannotAcquire, "Could not acquire briefcase");
    return briefcase.briefcaseId;
  }

  public releaseBriefcase(arg: BriefcaseIdArg): Promise<void> {
    const releaseBriefcaseParams: ReleaseBriefcaseParams = {
      ...this.getiModelScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId
    };

    return this._imodelsClient.Briefcases.release(releaseBriefcaseParams);
  }

  public async getMyBriefcaseIds(arg: IModelIdArg): Promise<BriefcaseId[]> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      ...this.getiModelScopedOperationParams(arg),
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    const briefcasesIterator: AsyncIterableIterator<Briefcase> = this._imodelsClient.Briefcases.getRepresentationList(getBriefcaseListParams);
    const briefcases: Briefcase[] = await toArray(briefcasesIterator);
    const briefcaseIds: BriefcaseId[] = briefcases.map(briefcase => briefcase.briefcaseId);
    return briefcaseIds;
  }

  public async downloadV1Checkpoint(arg: CheckpointArg): Promise<ChangesetId> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization: this.getAuthorizationCallbackFromiModelHost(),
      imodelId: arg.checkpoint.iModelId,
      changesetId: arg.checkpoint.changeset.id
    };

    const changeset: Changeset = await this._imodelsClient.Changesets.getSingle(getSingleChangesetParams);
    const checkpoint: Checkpoint | undefined = await changeset.getCurrentOrPrecedingCheckpoint();
    if (!checkpoint || !checkpoint._links?.download)
      throw new IModelError(BriefcaseStatus.VersionNotFound, "V1 checkpoint not found");

    let progressCallback: ProgressCallback | undefined = undefined;
    if (arg.onProgress)
      progressCallback = (progress: ProgressData) => arg.onProgress!(progress.bytesTransferred, progress.bytesTotal);

    await this._imodelsClient.FileHandler.downloadFile({ downloadUrl: checkpoint._links!.download.href, targetFilePath: arg.localFile, progressCallback });
    return checkpoint.changesetId;
  }

  public async queryV2Checkpoint(arg: CheckpointProps): Promise<V2CheckpointAccessProps | undefined> {
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      ...this.getiModelScopedOperationParams(arg),
      changesetId: arg.changeset.id
    };

    let checkpoint: Checkpoint;
    try {
      checkpoint = await this._imodelsClient.Checkpoints.getSingle(getSingleCheckpointParams);
    } catch (error) {
      // Means that neither v1 nor v2 checkpoint exists
      if (isiModelsApiError(error) && error.code === iModelsErrorCode.CheckpointNotFound)
        return undefined;

      throw error;
    }

    if (checkpoint.containerAccessInfo === null)
      // Means that v2 checkpoint does not exist
      return undefined;

    const result = ClientToPlatformAdapter.toV2CheckpointAccessProps(checkpoint.containerAccessInfo);
    return result;
  }

  public async downloadV2Checkpoint(arg: CheckpointArg): Promise<ChangesetId> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization: this.getAuthorizationCallbackFromiModelHost(),
      imodelId: arg.checkpoint.iModelId,
      changesetId: arg.checkpoint.changeset.id
    };

    const changeset: Changeset = await this._imodelsClient.Changesets.getSingle(getSingleChangesetParams);
    const checkpoint: Checkpoint | undefined = await changeset.getCurrentOrPrecedingCheckpoint();
    if (!checkpoint)
      throw new IModelError(IModelStatus.NotFound, "V2 checkpoint not found");

    const v2CheckpointAccessProps = ClientToPlatformAdapter.toV2CheckpointAccessProps(checkpoint.containerAccessInfo);

    const downloader = new IModelHost.platform.DownloadV2Checkpoint({
      ...v2CheckpointAccessProps,
      writeable: false,
      localFile: arg.localFile
    });

    let timer: NodeJS.Timeout | undefined;
    try {
      let total = 0;
      const onProgress = arg.onProgress;
      if (onProgress) {
        timer = setInterval(() => { // set an interval timer to show progress every 250ms
          const progress = downloader.getProgress();
          total = progress.total;
          if (onProgress(progress.loaded, progress.total))
            downloader.cancelDownload();
        }, 250);
      }
      await downloader.downloadPromise;
      onProgress?.(total, total); // make sure we call progress func one last time when download completes
    } catch (err) {
      throw (err.message === "cancelled") ? new UserCancelledError(BriefcaseStatus.DownloadCancelled, "download cancelled") : err;
    } finally {
      if (timer)
        clearInterval(timer);
    }
    return checkpoint.changesetId;
  }

  public async acquireLocks(arg: BriefcaseDbArg, locks: LockMap): Promise<void> {
    const updateLockParams: UpdateLockParams = {
      ...this.getiModelScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId,
      changesetId: arg.changeset.id,
      lockedObjects: PlatformToClientAdapter.toLockedObjects(locks)
    };

    await this._imodelsClient.Locks.update(updateLockParams);
  }

  public async queryAllLocks(arg: BriefcaseDbArg): Promise<LockProps[]> {
    const getLockListParams: GetLockListParams = {
      ...this.getiModelScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId
      }
    };

    const locksIterator: AsyncIterableIterator<Lock> = this._imodelsClient.Locks.getList(getLockListParams);
    const locks: Lock[] = await toArray(locksIterator);
    if (locks.length === 0)
      return [];

    const result: LockProps[] = ClientToPlatformAdapter.toLockProps(locks[0]);
    return result;
  }

  public async releaseAllLocks(arg: BriefcaseDbArg): Promise<void> {
    const getLockListParams: GetLockListParams = {
      ...this.getiModelScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId
      }
    };

    const locksIterator: AsyncIterableIterator<Lock> = this._imodelsClient.Locks.getList(getLockListParams);
    const locks: Lock[] = await toArray(locksIterator);
    if (locks.length === 0)
      return;

    const lock: Lock = locks[0];
    this.setLockLevelToNone(lock.lockedObjects);

    const updateLockParams: UpdateLockParams = {
      ...this.getiModelScopedOperationParams(arg),
      briefcaseId: lock.briefcaseId,
      changesetId: arg.changeset.id,
      lockedObjects: lock.lockedObjects
    };

    await this._imodelsClient.Locks.update(updateLockParams);
  }

  public async queryIModelByName(arg: IModelNameArg): Promise<GuidString | undefined> {
    const getiModelListParams: GetiModelListParams = {
      ...this.getAuthorizationParam(arg),
      urlParams: {
        projectId: arg.iTwinId,
        name: arg.iModelName
      }
    };

    const imodelsIterator: AsyncIterableIterator<MinimaliModel> = this._imodelsClient.iModels.getMinimalList(getiModelListParams);
    const imodels = await toArray(imodelsIterator);
    return imodels.length === 0 ? undefined : imodels[0].id;
  }

  public async createNewIModel(arg: CreateNewIModelProps): Promise<GuidString> {
    const baselineFilePath = this.prepareBaselineFile(arg);
    const createiModelFromBaselineParams: CreateiModelFromBaselineParams = {
      ...this.getAuthorizationParam(arg),
      imodelProperties: PlatformToClientAdapter.toiModelPropertiesForCreate(arg, baselineFilePath)
    };

    const imodel: iModel = await this._imodelsClient.iModels.createFromBaseline(createiModelFromBaselineParams);
    return imodel.id;
  }

  public deleteIModel(arg: IModelIdArg & ITwinIdArg): Promise<void> {
    const deleteiModelParams: DeleteiModelParams = this.getiModelScopedOperationParams(arg);
    return this._imodelsClient.iModels.delete(deleteiModelParams);
  }

  private getiModelScopedOperationParams(arg: IModelIdArg): iModelScopedOperationParams {
    return {
      ...this.getAuthorizationParam(arg),
      imodelId: arg.iModelId
    };
  }

  private getAuthorizationParam(tokenArg: TokenArg): AuthorizationParam {
    const authorizationCallback: AuthorizationCallback = tokenArg.accessToken
      ? PlatformToClientAdapter.toAuthorizationCallback(tokenArg.accessToken)
      : this.getAuthorizationCallbackFromiModelHost();

    return {
      authorization: authorizationCallback
    };
  }

  private getAuthorizationCallbackFromiModelHost(): AuthorizationCallback {
    return async () => {
      const token = await IModelHost.getAccessToken();
      return PlatformToClientAdapter.toAuthorization(token);
    };
  }

  private setLockLevelToNone(lockedObjectsForBriefcase: LockedObjects[]): void {
    for (const lockedObjects of lockedObjectsForBriefcase) {
      lockedObjects.lockLevel = LockLevel.None;
    }
  }

  private prepareBaselineFile(arg: CreateNewIModelProps): string {
    const revision0 = join(IModelHost.cacheDir, "temp-revision0.bim");
    IModelJsFs.removeSync(revision0);
    if (!arg.revision0) { // if they didn't supply a revision0 file, create a blank one.
      const blank = SnapshotDb.createEmpty(revision0, { rootSubject: { name: arg.description ?? arg.iModelName } });
      blank.saveChanges();
      blank.close();
    } else {
      IModelJsFs.copySync(arg.revision0, revision0);
    }

    const nativeDb = IModelDb.openDgnDb({ path: revision0 }, OpenMode.ReadWrite);
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

    return revision0;
  }
}
