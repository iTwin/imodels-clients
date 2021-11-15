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
  AcquireBriefcaseParams, AuthorizationCallback, AuthorizationParam, AzureSdkFileHandler, Briefcase, Changeset,
  ChangesetOrderByProperty, Checkpoint, CreateChangesetParams, CreateiModelFromBaselineParams, DeleteiModelParams,
  DownloadChangesetListParams, DownloadedChangeset, GetBriefcaseListParams, GetChangesetByIdParams, GetChangesetListParams,
  GetCheckpointByChangesetIdParams, GetLockListParams, GetNamedVersionListParams, GetiModelListParams, Lock, LockLevel,
  LockedObjects, MinimalChangeset, MinimalNamedVersion, MinimaliModel, OrderByOperator, ProgressCallback, ProgressData,
  ReleaseBriefcaseParams, SPECIAL_VALUES_ME, TargetDirectoryParam, UpdateLockParams, iModel, iModelScopedOperationParams,
  iModelsClient, iModelsError, iModelsErrorCode, toArray
} from "@itwin/imodels-client-authoring";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class BackendiModelsAccess implements BackendHubAccess {
  private readonly _azureFileHandler: AzureSdkFileHandler;
  private readonly _imodelsClient: iModelsClient;
  private readonly _changeSet0 = { id: "", changesType: 0, description: "revision0", parentId: "", briefcaseId: 0, pushDate: "", userCreated: "", index: 0 };

  constructor() {
    this._azureFileHandler = new AzureSdkFileHandler();
    this._imodelsClient = new iModelsClient({ fileHandler: this._azureFileHandler });
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
    const commonDownloadParams: iModelScopedOperationParams & TargetDirectoryParam = {
      ...this.getiModelScopedOperationParams(arg),
      targetDirectoryPath: arg.targetDir
    };

    const downloadedChangeset: DownloadedChangeset = arg.changeset.index
      ? await this._imodelsClient.Changesets.downloadByIndex({ ...commonDownloadParams, changesetIndex: arg.changeset.index })
      : await this._imodelsClient.Changesets.downloadById({ ...commonDownloadParams, changesetId: arg.changeset.id! });
    const result: ChangesetFileProps = ClientToPlatformAdapter.toChangesetFileProps(downloadedChangeset);
    return result;
  }

  public async queryChangeset(arg: ChangesetArg): Promise<ChangesetProps> {
    const imodelOperationParams: iModelScopedOperationParams = this.getiModelScopedOperationParams(arg);

    const changeset: Changeset = arg.changeset.index
      ? await this._imodelsClient.Changesets.getByIndex({ ...imodelOperationParams, changesetIndex: arg.changeset.index })
      : await this._imodelsClient.Changesets.getById({ ...imodelOperationParams, changesetId: arg.changeset.id! });
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

    const changesets: Changeset[] = await toArray(this._imodelsClient.Changesets.getRepresentationList(imodelOperationParams));
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
      changesetProperties: {
        id: arg.changesetProps.id,
        parentId: arg.changesetProps.parentId,
        containingChanges: PlatformToClientAdapter.toContainingChanges(arg.changesetProps.changesType),
        description: changesetDescription,
        briefcaseId: arg.changesetProps.briefcaseId,
        filePath: arg.changesetProps.pathname
      }
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

  public getChangesetFromVersion(arg: IModelIdArg & { version: IModelVersion; }): Promise<ChangesetProps> {
    const version = arg.version;
    if (version.isFirst)
      return Promise.resolve(this._changeSet0);

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

    const getChangesetByIdParams: GetChangesetByIdParams = {
      ...imodelOperationParams,
      changesetId: namedVersions[0].id
    };
    const changeset: MinimalChangeset = await this._imodelsClient.Changesets.getById(getChangesetByIdParams);
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
    const getChangesetByIdParams: GetChangesetByIdParams = {
      authorization: this.getAuthorizationCallbackFromiModelHost(),
      imodelId: arg.checkpoint.iModelId,
      changesetId: arg.checkpoint.changeset.id
    };
    const changeset: Changeset = await this._imodelsClient.Changesets.getById(getChangesetByIdParams);
    const checkpoint: Checkpoint | undefined = await changeset.getCurrentOrPrecedingCheckpoint();
    if (!checkpoint || !checkpoint._links?.download)
      throw new IModelError(BriefcaseStatus.VersionNotFound, "no checkpoints not found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cancelRequest: any = {};
    const progressCallback: ProgressCallback = (progress: ProgressData) => {
      if (arg.onProgress && arg.onProgress(progress.bytesTransferred, progress.bytesTotal) !== 0)
        cancelRequest.cancel?.();
    };

    await this._azureFileHandler.downloadFile({ downloadUrl: checkpoint._links!.download.href, targetFilePath: arg.localFile, progressCallback });
    return checkpoint.changesetId;
  }

  public async queryV2Checkpoint(arg: CheckpointProps): Promise<V2CheckpointAccessProps | undefined> {
    const getCheckpointParams: GetCheckpointByChangesetIdParams = {
      ...this.getiModelScopedOperationParams(arg),
      changesetId: arg.changeset.id
    };

    let checkpoint: Checkpoint;
    try {
      checkpoint = await this._imodelsClient.Checkpoints.getByChangesetId(getCheckpointParams);
    } catch (error) {
      // Means that neither v1 nor v2 checkpoint exists
      if (this.isiModelsApiError(error) && error.code === iModelsErrorCode.CheckpointNotFound)
        return undefined;

      throw error;
    }

    if (checkpoint.containerAccessInfo === null)
      // Means that v2 checkpoint does not exist
      return undefined;

    const { container, sas, account, dbName } = checkpoint.containerAccessInfo;
    if (!container || !sas || !account || !dbName)
      throw new IModelError(IModelStatus.NotFound, "invalid V2 checkpoint");

    return {
      container,
      auth: sas,
      user: account,
      dbAlias: dbName,
      storageType: "azure?sas=1"
    };
  }

  public async downloadV2Checkpoint(arg: CheckpointArg): Promise<ChangesetId> {
    const getChangesetByIdParams: GetChangesetByIdParams = {
      authorization: this.getAuthorizationCallbackFromiModelHost(),
      imodelId: arg.checkpoint.iModelId,
      changesetId: arg.checkpoint.changeset.id
    };
    const changeset: Changeset = await this._imodelsClient.Changesets.getById(getChangesetByIdParams);
    const checkpoint: Checkpoint | undefined = await changeset.getCurrentOrPrecedingCheckpoint();
    if (!checkpoint)
      throw new IModelError(IModelStatus.NotFound, "V2 checkpoint not found");

    const { container, sas, account, dbName } = checkpoint.containerAccessInfo;
    if (!container || !sas || !account || !dbName)
      throw new IModelError(IModelStatus.NotFound, "invalid V2 checkpoint");

    const downloader = new IModelHost.platform.DownloadV2Checkpoint({
      container,
      auth: sas,
      user: account,
      dbAlias: dbName,
      storageType: "azure?sas=1",
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
    const lockedObjects: LockedObjects[] = PlatformToClientAdapter.toLockedObjects(locks);
    const updateLockParams: UpdateLockParams = {
      ...this.getiModelScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId,
      changesetId: arg.changeset.id,
      lockedObjects
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
      imodelProperties: {
        projectId: arg.iTwinId,
        name: arg.iModelName,
        description: arg.description,
        filePath: baselineFilePath
      }
    };

    const imodel: iModel = await this._imodelsClient.iModels.createFromBaseline(createiModelFromBaselineParams);
    return imodel.id;
  }

  public deleteIModel(arg: IModelIdArg & ITwinIdArg): Promise<void> {
    const deleteiModelParams: DeleteiModelParams = this.getiModelScopedOperationParams(arg);
    return this._imodelsClient.iModels.delete(deleteiModelParams);
  }

  private isiModelsApiError(error: unknown): error is iModelsError {
    return (error as iModelsError)?.code !== undefined;
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
    return () => IModelHost.getAccessToken().then(PlatformToClientAdapter.toAuthorization);
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
