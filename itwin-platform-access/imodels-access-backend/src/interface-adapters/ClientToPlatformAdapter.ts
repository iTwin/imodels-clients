/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LockProps, LockState, V2CheckpointAccessProps } from "@itwin/core-backend";
import { ITwinError } from "@itwin/core-bentley";
import { ChangesetFileProps, ChangesetProps, ChangesetType } from "@itwin/core-common";

import { DownloadedChangeset, Lock, LockLevel } from "@itwin/imodels-client-authoring";
import { ContainerAccessInfo, ContainingChanges, IModelsErrorCode, IModelsErrorScope, MinimalChangeset, isIModelsApiError } from "@itwin/imodels-client-management";

export class ClientToPlatformAdapter {
  public static toChangesetProps(changeset: MinimalChangeset): ChangesetProps {
    return {
      id: changeset.id,
      index: changeset.index,
      parentId: changeset.parentId,
      changesType: ClientToPlatformAdapter.toChangesetType(changeset.containingChanges),
      description: changeset.description,
      briefcaseId: changeset.briefcaseId,
      pushDate: changeset.pushDateTime,
      userCreated: changeset.creatorId,
      size: changeset.fileSize
    };
  }

  public static toChangesetFileProps(changeset: DownloadedChangeset): ChangesetFileProps {
    return {
      ...ClientToPlatformAdapter.toChangesetProps(changeset),
      pathname: changeset.filePath
    };
  }

  public static toLockProps(lock: Lock): LockProps[] {
    const result: LockProps[] = [];
    for (const lockedObjectsForBriefcase of lock.lockedObjects)
      for (const objectId of lockedObjectsForBriefcase.objectIds)
        result.push({ id: objectId, state: ClientToPlatformAdapter.toLockState(lockedObjectsForBriefcase.lockLevel) });

    return result;
  }

  public static toV2CheckpointAccessProps(containerAccessInfo: ContainerAccessInfo): V2CheckpointAccessProps {
    if (!containerAccessInfo.container || !containerAccessInfo.sas || !containerAccessInfo.account || !containerAccessInfo.dbName)
      ITwinError.throwError({
        iTwinErrorId: {
          key: IModelsErrorCode.CheckpointNotFound,
          scope: IModelsErrorScope
        },
        message: "Invalid V2 checkpoint"
      });

    return {
      containerId: containerAccessInfo.container,
      sasToken: containerAccessInfo.sas,
      accountName: containerAccessInfo.account,
      dbName: containerAccessInfo.dbName,
      storageType: "azure?sas=1"
    };
  }

  public static toChangesetDownloadAbortedError(error: unknown): unknown {
    if (!isIModelsApiError(error) || error.code !== IModelsErrorCode.DownloadAborted)
      return error;

    return ITwinError.create({ iTwinErrorId: { key: IModelsErrorCode.DownloadCancelled, scope: IModelsErrorScope }, message: error.message });
  }

  // eslint-disable-next-line deprecation/deprecation
  private static toLockState(lockLevel: LockLevel): LockState {
    switch (lockLevel) {
      case LockLevel.None:
        // eslint-disable-next-line deprecation/deprecation
        return LockState.None;
      case LockLevel.Shared:
        // eslint-disable-next-line deprecation/deprecation
        return LockState.Shared;
      case LockLevel.Exclusive:
        // eslint-disable-next-line deprecation/deprecation
        return LockState.Exclusive;
      default:
        ITwinError.throwError({
          iTwinErrorId: {
            key: IModelsErrorCode.InvalidIModelsRequest,
            scope: IModelsErrorScope
          },
          message: "Unsupported LockLevel"
        });
    }
  }

  private static toChangesetType(containingChanges: ContainingChanges): ChangesetType {
    switch (containingChanges) {
      case ContainingChanges.Schema:
        return ChangesetType.Schema;
      default:
        return ChangesetType.Regular;
    }
  }
}
