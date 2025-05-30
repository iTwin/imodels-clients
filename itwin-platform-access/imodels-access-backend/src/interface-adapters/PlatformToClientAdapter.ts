/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateNewIModelProps,
  LockMap,
  LockState,
  ProgressFunction,
  ProgressStatus,
} from "@itwin/core-backend";
import { ITwinError } from "@itwin/core-bentley";
import {
  ChangesetFileProps,
  ChangesetRange,
  ChangesetType,
  ChangesetIndexOrId as PlatformChangesetIdOrIndex,
} from "@itwin/core-common";
import {
  ChangesetPropertiesForCreate,
  DownloadProgressParam,
  LockLevel,
  LockedObjects,
} from "@itwin/imodels-client-authoring";
import {
  ChangesetIdOrIndex as ClientChangesetIdOrIndex,
  ContainingChanges,
  GetChangesetListUrlParams,
  IModelProperties,
  IModelsErrorCode,
  IModelsErrorScope,
} from "@itwin/imodels-client-management";

interface DownloadCancellationMonitorFuncParams {
  shouldCancel: boolean;
}
export type DownloadCancellationMonitorFunc = (
  params: DownloadCancellationMonitorFuncParams
) => void;

export class PlatformToClientAdapter {
  public static toChangesetPropertiesForCreate(
    changesetFileProps: ChangesetFileProps,
    changesetDescription: string
  ): ChangesetPropertiesForCreate {
    return {
      id: changesetFileProps.id,
      parentId: changesetFileProps.parentId,
      containingChanges: PlatformToClientAdapter.toContainingChanges(
        changesetFileProps.changesType
      ),
      description: changesetDescription,
      briefcaseId: changesetFileProps.briefcaseId,
      filePath: changesetFileProps.pathname,
    };
  }

  public static toIModelProperties(
    createNewIModelProps: CreateNewIModelProps
  ): IModelProperties {
    return {
      iTwinId: createNewIModelProps.iTwinId,
      name: createNewIModelProps.iModelName,
      description: createNewIModelProps.description,
    };
  }

  public static toLockedObjects(locks: LockMap): LockedObjects[] {
    const groupedLocks: Map<LockLevel, string[]> =
      PlatformToClientAdapter.groupLocksByLockLevel(locks);
    const result: LockedObjects[] =
      PlatformToClientAdapter.convertGroupedLocksToLockedObjects(groupedLocks);
    return result;
  }

  public static toContainingChanges(
    changesType: ChangesetType
  ): ContainingChanges {
    switch (changesType as number) {
      case ChangesetType.Regular as number:
        return ContainingChanges.Regular;
      case ChangesetType.Schema as number:
        return ContainingChanges.Schema;
      case ContainingChanges.Schema | ContainingChanges.SchemaSync:
        return ContainingChanges.Schema | ContainingChanges.SchemaSync;
      default:
        ITwinError.throwError({
          iTwinErrorId: {
            key: IModelsErrorCode.InvalidIModelsRequest,
            scope: IModelsErrorScope,
          },
          message: "Unsupported ContainingChanges",
        });
    }
  }

  public static toChangesetIdOrIndex(
    changeset: PlatformChangesetIdOrIndex
  ): ClientChangesetIdOrIndex {
    // The API only supports index in the url for changeset0.
    if (changeset.id === "" || changeset.index === 0)
      return { changesetIndex: 0 };
    if (changeset.index) return { changesetIndex: changeset.index };
    if (changeset.id) return { changesetId: changeset.id };

    ITwinError.throwError({
      iTwinErrorId: {
        key: IModelsErrorCode.InvalidIModelsRequest,
        scope: IModelsErrorScope,
      },
      message: "Both changeset id and index are undefined",
    });
  }

  public static toChangesetRangeUrlParams(
    changesetRange?: ChangesetRange
  ): Partial<GetChangesetListUrlParams> | undefined {
    if (!changesetRange) return undefined;

    return {
      lastIndex: changesetRange.end,
      // The API never returns changeset0 so "first index = 0" and "after index = 0" are equivalent.
      afterIndex: changesetRange.first === 0 ? 0 : changesetRange.first - 1,
    };
  }

  /**
   * @returns `progressCallback` and `abortSignal` instances to pass to iModels client functions, and `downloadCancellationMonitorFunc`.
   * IMPORTANT: `downloadCancellationMonitorFunc` must be called at least once to not leave pending promises.
   */
  public static toDownloadProgressParam(progressCallback?: ProgressFunction):
    | (DownloadProgressParam & {
        downloadCancellationMonitorFunc: DownloadCancellationMonitorFunc;
      })
    | undefined {
    if (!progressCallback) return;

    const abortController = new AbortController();

    // We construct a promise which, if resolved with `{ shouldCancel: true }`, will cancel the download.
    // We have to do this instead of calling `abortController.abort` inside `progressCallback` function because `progressCallback` is called inside "on `data`"
    // event handler of the download stream, which is out of the execution context of the `iModelsClient.changesets.downloadList` function. That results in an
    // unhandled exception.
    let downloadCancellationMonitorFunc: DownloadCancellationMonitorFunc =
      undefined!;
    void new Promise<DownloadCancellationMonitorFuncParams>((resolve) => {
      downloadCancellationMonitorFunc = resolve;
    }).then((params: DownloadCancellationMonitorFuncParams) => {
      if (params.shouldCancel) abortController.abort();
    });

    const convertedProgressCallback = (downloaded: number, total: number) => {
      const cancel = progressCallback(downloaded, total);
      if (cancel !== ProgressStatus.Continue)
        downloadCancellationMonitorFunc({ shouldCancel: true });
    };

    return {
      progressCallback: convertedProgressCallback,
      abortSignal: abortController.signal,
      downloadCancellationMonitorFunc,
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
        ITwinError.throwError({
          iTwinErrorId: {
            key: IModelsErrorCode.InvalidIModelsRequest,
            scope: IModelsErrorScope,
          },
          message: "Unsupported LockState",
        });
    }
  }

  private static groupLocksByLockLevel(
    locks: LockMap
  ): Map<LockLevel, string[]> {
    const result: Map<LockLevel, string[]> = new Map();
    for (const [objectId, lockState] of locks) {
      const lockLevel: LockLevel =
        PlatformToClientAdapter.toLockLevel(lockState);
      const lockedObjectsIds: string[] | undefined = result.get(lockLevel);
      if (lockedObjectsIds) lockedObjectsIds.push(objectId);
      else result.set(lockLevel, [objectId]);
    }

    return result;
  }

  private static convertGroupedLocksToLockedObjects(
    groupedLocks: Map<LockLevel, string[]>
  ): LockedObjects[] {
    const result: LockedObjects[] = [];
    for (const lockLevel of groupedLocks.keys())
      result.push({ lockLevel, objectIds: groupedLocks.get(lockLevel)! });

    return result;
  }
}
