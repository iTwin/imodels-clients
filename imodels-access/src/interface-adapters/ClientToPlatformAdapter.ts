/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LockProps, LockState } from "@itwin/core-backend";
import { RepositoryStatus } from "@itwin/core-bentley";
import { ChangesetFileProps, ChangesetProps, ChangesetType, IModelError } from "@itwin/core-common";
import { ContainingChanges, DownloadedChangeset, Lock, LockLevel, MinimalChangeset } from "@itwin/imodels-client-authoring";

export class ClientToPlatformAdapter {
  public static toChangesetProps(changeset: MinimalChangeset): ChangesetProps {
    return {
      id: changeset.id,
      index: changeset.index,
      parentId: changeset.parentId,
      changesType: ClientToPlatformAdapter.toChangesetType(changeset.containingChanges),
      description: changeset.description,
      briefcaseId: changeset.briefcaseId,
      pushDate: changeset.pushDateTime.toISOString(), // TODO: really this format?
      userCreated: changeset.creatorId
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
    for (const lockedObjects of lock.lockedObjects)
      for (const objectId of lockedObjects.objectIds)
        result.push({ id: objectId, state: ClientToPlatformAdapter.toLockState(lockedObjects.lockLevel) });

    return result;
  }


  private static toLockState(lockLevel: LockLevel): LockState {
    switch (lockLevel) {
    case LockLevel.None:
      return LockState.None;
    case LockLevel.Shared:
      return LockState.Shared;
    case LockLevel.Exclusive:
      return LockState.Exclusive;
    default:
      throw new IModelError(RepositoryStatus.InvalidResponse, "Unsupported LockLevel");
    }
  }

  private static toChangesetType(containingChanges: ContainingChanges): ChangesetType {
    switch (containingChanges) {
    case ContainingChanges.Regular:
      return ChangesetType.Regular;
    case ContainingChanges.Schema:
      return ChangesetType.Schema;
    default:
      throw new IModelError(RepositoryStatus.InvalidResponse, "Unsupported ContainingChanges");
    }
  }
}
