/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AbortController } from "@azure/abort-controller";
import { CreateNewIModelProps, LockMap, LockState, ProgressFunction, ProgressStatus } from "@itwin/core-backend";
import { RepositoryStatus } from "@itwin/core-bentley";
import { ChangesetFileProps, ChangesetRange, ChangesetType, IModelError, ChangesetIndexOrId as PlatformChangesetIdOrIndex } from "@itwin/core-common";

import {
  ChangesetPropertiesForCreate, ChangesetIdOrIndex as ClientChangesetIdOrIndex, ContainingChanges, DownloadProgressParam, GetChangesetListUrlParams, IModelProperties,
  LockLevel, LockedObjects
} from "@itwin/imodels-client-authoring";

interface DownloadAbortWatchdogFuncParams { shouldAbort: boolean }
export type DownloadAbortWatchdogFunc = (params: DownloadAbortWatchdogFuncParams) => void;

export class PlatformToClientAdapter {
  public static toChangesetPropertiesForCreate(changesetFileProps: ChangesetFileProps, changesetDescription: string): ChangesetPropertiesForCreate {
    return {
      id: changesetFileProps.id,
      parentId: changesetFileProps.parentId,
      containingChanges: PlatformToClientAdapter.toContainingChanges(changesetFileProps.changesType),
      description: changesetDescription,
      briefcaseId: changesetFileProps.briefcaseId,
      filePath: changesetFileProps.pathname
    };
  }

  public static toIModelProperties(createNewIModelProps: CreateNewIModelProps): IModelProperties {
    return {
      iTwinId: createNewIModelProps.iTwinId,
      name: createNewIModelProps.iModelName,
      description: createNewIModelProps.description
    };
  }

  public static toLockedObjects(locks: LockMap): LockedObjects[] {
    const groupedLocks: Map<LockLevel, string[]> = PlatformToClientAdapter.groupLocksByLockLevel(locks);
    const result: LockedObjects[] = PlatformToClientAdapter.convertGroupedLocksToLockedObjects(groupedLocks);
    return result;
  }

  public static toContainingChanges(changesType: ChangesetType): ContainingChanges {
    switch (changesType as number) {
      case ChangesetType.Regular as number:
        return ContainingChanges.Regular;
      case ChangesetType.Schema as number:
        return ContainingChanges.Schema;
      case (ContainingChanges.Schema | ContainingChanges.SchemaSync):
        return ContainingChanges.Schema | ContainingChanges.SchemaSync;
      default:
        throw new IModelError(RepositoryStatus.InvalidRequest, "Unsupported ContainingChanges");
    }
  }

  public static toChangesetIdOrIndex(changeset: PlatformChangesetIdOrIndex): ClientChangesetIdOrIndex {
    // The API only supports index in the url for changeset0.
    if (changeset.id === "" || changeset.index === 0)
      return { changesetIndex: 0 };
    if (changeset.index)
      return { changesetIndex: changeset.index };
    if (changeset.id)
      return { changesetId: changeset.id };

    throw new IModelError(RepositoryStatus.InvalidRequest, "Both changeset id and index are undefined");
  }

  public static toChangesetRangeUrlParams(changesetRange?: ChangesetRange): Partial<GetChangesetListUrlParams> | undefined {
    if (!changesetRange)
      return undefined;

    return {
      lastIndex: changesetRange.end,
      // The API never returns changeset0 so "first index = 0" and "after index = 0" are equivalent.
      afterIndex: changesetRange.first === 0
        ? 0
        : changesetRange.first - 1
    };
  }

  /**
   * @returns `progressCallback` and `abortSignal` instances to pass to iModels client functions, and `downloadAbortWatchdogFunc`.
   * IMPORTANT: `downloadAbortWatchdogFunc` must be called at least once to not leave pending promises.
   */
  public static toDownloadProgressParam(progressCallback?: ProgressFunction): (DownloadProgressParam & { downloadAbortWatchdogFunc: DownloadAbortWatchdogFunc }) | undefined {
    if (!progressCallback)
      return;

    const abortController = new AbortController();

    // We construct a promise which, if resolved with `{ shouldAbort: true }`, will abort the download.
    // We have to do this instead of calling `abortController.abort` inside `progressCallback` function because `progressCallback` is called inside "on `data`"
    // event handler of the download stream, which is out of the execution context of the `iModelsClient.changesets.downloadList` function. That results in an
    // unhandled exception.
    let downloadAbortWatchdogFunc: DownloadAbortWatchdogFunc = undefined!;
    void new Promise<DownloadAbortWatchdogFuncParams>((resolve) => {
      downloadAbortWatchdogFunc = resolve;
    }).then((params: DownloadAbortWatchdogFuncParams) => {
      // eslint-disable-next-line no-console
      console.log("inside then");
      if (params.shouldAbort) {
        // eslint-disable-next-line no-console
        console.log("aborting");
        abortController.abort();
      } else {
        // eslint-disable-next-line no-console
        console.log("not aborting");
      }
    });

    const convertedProgressCallback = (downloaded: number, total: number) => {
      const cancel = progressCallback(downloaded, total);
      if (cancel !== ProgressStatus.Continue)
        downloadAbortWatchdogFunc({ shouldAbort: true });
    };

    return {
      progressCallback: convertedProgressCallback,
      abortSignal: abortController.signal,
      downloadAbortWatchdogFunc
    };
  }

  // eslint-disable-next-line deprecation/deprecation
  private static toLockLevel(lockState: LockState): LockLevel {
    switch (lockState) {
      // eslint-disable-next-line deprecation/deprecation
      case LockState.None:
        return LockLevel.None;
      // eslint-disable-next-line deprecation/deprecation
      case LockState.Shared:
        return LockLevel.Shared;
      // eslint-disable-next-line deprecation/deprecation
      case LockState.Exclusive:
        return LockLevel.Exclusive;
      default:
        throw new IModelError(RepositoryStatus.InvalidRequest, "Unsupported LockState");
    }
  }

  private static groupLocksByLockLevel(locks: LockMap): Map<LockLevel, string[]> {
    const result: Map<LockLevel, string[]> = new Map();
    for (const [objectId, lockState] of locks) {
      const lockLevel: LockLevel = PlatformToClientAdapter.toLockLevel(lockState);
      const lockedObjectsIds: string[] | undefined = result.get(lockLevel);
      if (lockedObjectsIds)
        lockedObjectsIds.push(objectId);
      else
        result.set(lockLevel, [objectId]);
    }

    return result;
  }

  private static convertGroupedLocksToLockedObjects(groupedLocks: Map<LockLevel, string[]>): LockedObjects[] {
    const result: LockedObjects[] = [];
    for (const lockLevel of groupedLocks.keys())
      result.push({ lockLevel, objectIds: groupedLocks.get(lockLevel)! });

    return result;
  }
}
