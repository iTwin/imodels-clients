/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { join } from "path";

import {
  AcquireNewBriefcaseIdArg, BackendHubAccess, BriefcaseDbArg, BriefcaseIdArg, BriefcaseLocalValue, ChangesetArg,
  ChangesetRangeArg, CheckpointArg, CheckpointProps, CreateNewIModelProps, DownloadChangesetArg, DownloadChangesetRangeArg,
  IModelDb, IModelHost, IModelIdArg, IModelJsFs, IModelJsNative, IModelNameArg, ITwinIdArg, KnownLocations, LockMap, LockProps, SnapshotDb, TokenArg, V2CheckpointAccessProps
} from "@itwin/core-backend";
import { AccessToken, BriefcaseStatus, Guid, GuidString, Logger, OpenMode, StopWatch } from "@itwin/core-bentley";
import {
  BriefcaseId, BriefcaseIdValue, ChangesetFileProps, ChangesetIndex, ChangesetIndexAndId, ChangesetProps, IModelError,
  IModelVersion
} from "@itwin/core-common";
import { AccessTokenAdapter } from "@itwin/imodels-access-common/lib/AccessTokenAdapter";
import { getLatestFullChangesetIfExists, getNamedVersionChangeset } from "@itwin/imodels-access-common/lib/ChangesetFunctions";
import { Constants } from "@itwin/imodels-access-common/lib/Constants";
import { ErrorAdapter } from "@itwin/imodels-access-common/lib/ErrorAdapter";
import { handleAPIErrors } from "@itwin/imodels-access-common/lib/ErrorHandlingFunctions";
import { downloadFile } from "@itwin/imodels-client-authoring/lib/operations";

import {
  AcquireBriefcaseParams, AuthorizationCallback, AuthorizationParam, Briefcase, Changeset,
  Checkpoint, CreateChangesetParams, CreateIModelFromBaselineParams,
  DeleteIModelParams, DownloadChangesetListParams, DownloadSingleChangesetParams, DownloadedChangeset,
  EntityListIterator, GetBriefcaseListParams, GetChangesetListParams, GetIModelListParams, GetLockListParams,
  GetSingleChangesetParams, GetSingleCheckpointParams, IModel, IModelScopedOperationParams, IModelsClient, IModelsErrorCode,
  Lock, LockLevel, LockedObjects, MinimalChangeset, MinimalIModel,
  ReleaseBriefcaseParams, SPECIAL_VALUES_ME, UpdateLockParams, isIModelsApiError, take, toArray
} from "@itwin/imodels-client-authoring";

import { getV1CheckpointSize, queryCurrentOrPrecedingV1Checkpoint, queryCurrentOrPrecedingV2Checkpoint } from "./CheckpointHelperFunctions";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { DownloadCancellationMonitorFunc, PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export class BackendIModelsAccess implements BackendHubAccess {
  protected readonly _iModelsClient: IModelsClient;

  constructor(iModelsClient?: IModelsClient) {
    this._iModelsClient = iModelsClient ?? new IModelsClient();
  }

  public async downloadChangesets(arg: DownloadChangesetRangeArg): Promise<ChangesetFileProps[]> {
    const downloadParams: DownloadChangesetListParams = {
      ...this.getIModelScopedOperationParams(arg),
      targetDirectoryPath: arg.targetDir
    };
    downloadParams.urlParams = PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    let downloadCancellationMonitorFunc: DownloadCancellationMonitorFunc | undefined;
    try {
      const downloadProgressParams = PlatformToClientAdapter.toDownloadProgressParam(arg.progressCallback);
      downloadCancellationMonitorFunc = downloadProgressParams?.downloadCancellationMonitorFunc;
      downloadParams.progressCallback = downloadProgressParams?.progressCallback;
      downloadParams.abortSignal = downloadProgressParams?.abortSignal;

      const downloadedChangesets: DownloadedChangeset[] = await handleAPIErrors(
        async () => this._iModelsClient.changesets.downloadList(downloadParams),
        "downloadChangesets"
      );

      const result: ChangesetFileProps[] = downloadedChangesets.map(ClientToPlatformAdapter.toChangesetFileProps);
      return result;
    } finally {
      downloadCancellationMonitorFunc?.({ shouldCancel: false });
    }
  }

  public async downloadChangeset(arg: DownloadChangesetArg): Promise<ChangesetFileProps> {
    const downloadSingleChangesetParams: DownloadSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset),
      targetDirectoryPath: arg.targetDir
    };

    let downloadCancellationMonitorFunc: DownloadCancellationMonitorFunc | undefined;
    try {
      const downloadProgressParams = PlatformToClientAdapter.toDownloadProgressParam(arg.progressCallback);
      downloadCancellationMonitorFunc = downloadProgressParams?.downloadCancellationMonitorFunc;
      downloadSingleChangesetParams.progressCallback = downloadProgressParams?.progressCallback;
      downloadSingleChangesetParams.abortSignal = downloadProgressParams?.abortSignal;

      const downloadedChangeset: DownloadedChangeset = await handleAPIErrors(
        async () => {
          const stopwatch = new StopWatch(`[${arg.changeset.id}]`, true);
          Logger.logInfo("BackendIModelsAccess", `Starting download of changeset with id ${stopwatch.description}`);

          const innerResult = await this._iModelsClient.changesets.downloadSingle(downloadSingleChangesetParams);

          Logger.logInfo("BackendIModelsAccess", `Downloaded changeset with id ${stopwatch.description} (${stopwatch.elapsedSeconds} seconds)`);
          return innerResult;
        },
        "downloadChangesets"
      );

      const result: ChangesetFileProps = ClientToPlatformAdapter.toChangesetFileProps(downloadedChangeset);
      return result;
    } finally {
      downloadCancellationMonitorFunc?.({ shouldCancel: false });
    }
  }

  public async queryChangeset(arg: ChangesetArg): Promise<ChangesetProps> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIModelScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset)
    };

    const changeset: Changeset = await handleAPIErrors(
      async () => this._iModelsClient.changesets.getSingle(getSingleChangesetParams)
    );

    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async queryChangesets(arg: ChangesetRangeArg): Promise<ChangesetProps[]> {
    const iModelOperationParams: GetChangesetListParams = this.getIModelScopedOperationParams(arg);
    iModelOperationParams.urlParams = PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    const changesetsIterator: EntityListIterator<Changeset> = this._iModelsClient.changesets.getRepresentationList(iModelOperationParams);
    const changesets: Changeset[] = await handleAPIErrors(
      async () => toArray(changesetsIterator)
    );

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
    const createdChangeset: Changeset = await handleAPIErrors(
      async () => this._iModelsClient.changesets.create(createChangesetParams),
      "createChangeset"
    );

    return createdChangeset.index;
  }

  public async getLatestChangeset(arg: IModelIdArg): Promise<ChangesetProps> {
    const latestChangeset = await getLatestFullChangesetIfExists(
      this._iModelsClient,
      this.getIModelScopedOperationParams(arg)
    );

    if (!latestChangeset)
      return Constants.ChangeSet0;

    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(latestChangeset);
    return result;
  }

  public async getChangesetFromVersion(arg: IModelIdArg & { version: IModelVersion }): Promise<ChangesetProps> {
    const version = arg.version;
    if (version.isFirst)
      return Constants.ChangeSet0;

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
    const namedVersionChangeset = await getNamedVersionChangeset(
      this._iModelsClient,
      iModelOperationParams,
      arg.versionName
    );

    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...iModelOperationParams,
      changesetId: namedVersionChangeset.id
    };

    const changeset: MinimalChangeset = await handleAPIErrors(
      async () => this._iModelsClient.changesets.getSingle(getSingleChangesetParams)
    );

    const result: ChangesetProps = ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async acquireNewBriefcaseId(arg: AcquireNewBriefcaseIdArg): Promise<BriefcaseId> {
    const acquireBriefcaseParams: AcquireBriefcaseParams = this.getIModelScopedOperationParams(arg);

    const briefcase: Briefcase = await handleAPIErrors(
      async () => this._iModelsClient.briefcases.acquire(acquireBriefcaseParams),
      "acquireBriefcase"
    );

    if (!briefcase)
      throw new IModelError(BriefcaseStatus.CannotAcquire, "Could not acquire briefcase");
    return briefcase.briefcaseId;
  }

  public async releaseBriefcase(arg: BriefcaseIdArg): Promise<void> {
    const releaseBriefcaseParams: ReleaseBriefcaseParams = {
      ...this.getIModelScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId
    };

    await handleAPIErrors(
      async () => this._iModelsClient.briefcases.release(releaseBriefcaseParams)
    );
  }

  public async getMyBriefcaseIds(arg: IModelIdArg): Promise<BriefcaseId[]> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    const briefcasesIterator: EntityListIterator<Briefcase> = this._iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams);
    const briefcases: Briefcase[] = await handleAPIErrors(
      async () => toArray(briefcasesIterator)
    );

    const briefcaseIds: BriefcaseId[] = briefcases.map((briefcase) => briefcase.briefcaseId);
    return briefcaseIds;
  }

  // eslint-disable-next-line deprecation/deprecation
  public async downloadV1Checkpoint(arg: CheckpointArg): Promise<ChangesetIndexAndId> {
    const iModelScopedOperationParams: IModelScopedOperationParams = {
      ...this.getAuthorizationParam(arg.checkpoint),
      iModelId: arg.checkpoint.iModelId
    };
    const checkpoint: Checkpoint | undefined = await queryCurrentOrPrecedingV1Checkpoint(
      this._iModelsClient,
      iModelScopedOperationParams,
      arg
    );
    if (!checkpoint || !checkpoint._links?.download)
      throw new IModelError(BriefcaseStatus.VersionNotFound, "V1 checkpoint not found");

    const v1CheckpointSize = await getV1CheckpointSize(checkpoint._links.download.href);

    let downloadCancellationMonitorFunc: DownloadCancellationMonitorFunc | undefined;
    try {
      const downloadProgressParams = PlatformToClientAdapter.toDownloadProgressParam(arg.onProgress);
      downloadCancellationMonitorFunc = downloadProgressParams?.downloadCancellationMonitorFunc;
      const totalDownloadCallback = downloadProgressParams?.progressCallback
        ? (downloaded: number) => downloadProgressParams.progressCallback?.(downloaded, v1CheckpointSize)
        : undefined;

      const stopwatch = new StopWatch(`[${checkpoint.changesetId}]`, true);
      Logger.logInfo("BackendIModelsAccess", `Starting download of checkpoint with id ${stopwatch.description}`);
      await downloadFile({
        storage: this._iModelsClient.cloudStorage,
        url: checkpoint._links.download.href,
        localPath: arg.localFile,
        totalDownloadCallback,
        abortSignal: downloadProgressParams?.abortSignal
      });
      Logger.logInfo("BackendIModelsAccess", `Downloaded checkpoint with id ${stopwatch.description} (${stopwatch.elapsedSeconds} seconds)`);

      return { index: checkpoint.changesetIndex, id: checkpoint.changesetId };
    } finally {
      downloadCancellationMonitorFunc?.({ shouldCancel: false });
    }
  }

  public async queryV2Checkpoint(arg: CheckpointProps): Promise<V2CheckpointAccessProps | undefined> {
    const iModelScopedOperationParams = this.getIModelScopedOperationParams(arg);
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
        return arg?.allowPreceding
          ? queryCurrentOrPrecedingV2Checkpoint(
            this._iModelsClient,
            iModelScopedOperationParams,
            arg
          )
          : undefined;
      }

      throw ErrorAdapter.toIModelError(error);
    }

    // Means the v2 checkpoint does not exist.
    if (checkpoint.containerAccessInfo === null) {
      return arg?.allowPreceding
        ? queryCurrentOrPrecedingV2Checkpoint(
          this._iModelsClient,
          iModelScopedOperationParams,
          arg
        )
        : undefined;
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

    await handleAPIErrors(
      async () => this._iModelsClient.locks.update(updateLockParams),
      "updateLocks"
    );
  }

  public async queryAllLocks(arg: BriefcaseDbArg): Promise<LockProps[]> {
    const getLockListParams: GetLockListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId
      }
    };

    const locksIterator: EntityListIterator<Lock> = this._iModelsClient.locks.getList(getLockListParams);
    const locks: Lock[] = await handleAPIErrors(
      async () => toArray(locksIterator)
    );

    if (locks.length === 0)
      return [];
    const result: LockProps[] = locks.flatMap(ClientToPlatformAdapter.toLockProps);
    return result;
  }

  public async releaseAllLocks(arg: BriefcaseDbArg): Promise<void> {
    let shouldQueryMoreLocks = true;

    do {
      const locksPage: Lock[] = await this.getFirstLocksPage(arg);
      shouldQueryMoreLocks = this.shouldQueryMoreLocks(locksPage);

      await this.releaseLocksPage(arg, locksPage);

    } while (shouldQueryMoreLocks);
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
    const iModels = await handleAPIErrors(
      async () => toArray(iModelsIterator)
    );

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

    const iModel: IModel = await handleAPIErrors(
      async () => this._iModelsClient.iModels.createFromBaseline(createIModelFromBaselineParams)
    );

    IModelJsFs.removeSync(baselineFilePath);
    return iModel.id;
  }

  public async deleteIModel(arg: IModelIdArg & ITwinIdArg): Promise<void> {
    const deleteIModelParams: DeleteIModelParams = this.getIModelScopedOperationParams(arg);

    return handleAPIErrors(
      async () => this._iModelsClient.iModels.delete(deleteIModelParams)
    );
  }

  private getIModelScopedOperationParams(arg: IModelIdArg): IModelScopedOperationParams {
    return {
      ...this.getAuthorizationParam(arg),
      iModelId: arg.iModelId
    };
  }

  private getAuthorizationParam(tokenArg: TokenArg): AuthorizationParam {
    const authorizationCallback: AuthorizationCallback = tokenArg.accessToken
      ? this.getAuthorizationCallbackFromToken(tokenArg.accessToken)
      : AccessTokenAdapter.toAuthorizationCallback(IModelHost.getAccessToken);

    return {
      authorization: authorizationCallback
    };
  }

  private getAuthorizationCallbackFromToken(accessToken: AccessToken): AuthorizationCallback {
    return async () => AccessTokenAdapter.toAuthorization(accessToken);
  }

  private setLockLevelToNone(lockedObjectsForBriefcase: LockedObjects[]): void {
    for (const lockedObjects of lockedObjectsForBriefcase) {
      lockedObjects.lockLevel = LockLevel.None;
    }
  }

  private copyAndPrepareBaselineFile(arg: CreateNewIModelProps): string {
    const tempBaselineFilePath = join(KnownLocations.tmpdir, `temp-baseline-${Guid.createValue()}.bim`);
    IModelJsFs.removeSync(tempBaselineFilePath);

    const baselineFilePath = arg.version0;
    if (!baselineFilePath) { // if they didn't supply a baseline file, create a blank one.
      const emptyBaseline = SnapshotDb.createEmpty(tempBaselineFilePath, { rootSubject: { name: arg.description ?? arg.iModelName } });
      emptyBaseline.saveChanges();
      emptyBaseline.close();
    } else {
      // Check for wal before we open because opening for readWrite will create a 0 byte wal file.
      const foundWalFile = IModelJsFs.existsSync(`${baselineFilePath}-wal`);
      const db = IModelDb.openDgnDb({ path: baselineFilePath }, OpenMode.ReadWrite);
      if (foundWalFile) {
        Logger.logWarning("BackendIModelsAccess", "Wal file found while uploading file, performing checkpoint.", { baselineFilePath });
        db.performCheckpoint();
      }
      this.closeFile(db);
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
      this.closeFile(nativeDb);
    }

    return tempBaselineFilePath;
  }

  private closeFile(db: IModelJsNative.DgnDb): void {
    if ((db as any).closeIModel)
      (db as any).closeIModel();
    else
      db.closeFile();
  }

  private async getFirstLocksPage(arg: BriefcaseDbArg): Promise<Lock[]> {
    const getLockListParams: GetLockListParams = {
      ...this.getIModelScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId
      }
    };

    const lockPagesIterator = this._iModelsClient.locks.getList(getLockListParams).byPage();
    const lockPages = await handleAPIErrors(
      async () => take(lockPagesIterator, 1)
    );

    return lockPages[0];
  }

  private shouldQueryMoreLocks(currentResult: Lock[]): boolean {
    // `$top` parameter in "Get iModel Locks" operation limits `objectIds` within Lock entity, not `Lock` entities themselves.
    // https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-locks/#paging
    // So instead of checking for `currentResult.length === pageSize` we should check if `currentResult[idx].objectIds === pageSize`
    // which would require to iterate over all `currentResult` entities.

    // To simplify logic we check for a non-empty result. This means that we will terminate iteration over Locks only
    // after we receive an empty response.

    return currentResult.length !== 0;
  }

  private async releaseLocksPage(arg: BriefcaseDbArg, locksPage: Lock[]): Promise<void> {
    if (locksPage.length === 0)
      return;

    for (const lock of locksPage) {
      this.setLockLevelToNone(lock.lockedObjects);

      const updateLockParams: UpdateLockParams = {
        ...this.getIModelScopedOperationParams(arg),
        briefcaseId: lock.briefcaseId,
        changesetId: arg.changeset.id,
        lockedObjects: lock.lockedObjects
      };

      await handleAPIErrors(
        async () => this._iModelsClient.locks.update(updateLockParams),
        "updateLocks"
      );
    }
  }
}
