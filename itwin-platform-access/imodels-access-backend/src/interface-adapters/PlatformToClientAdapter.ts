/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateNewIModelProps, LockMap, LockState } from "@itwin/core-backend";
import { AccessToken, RepositoryStatus } from "@itwin/core-bentley";
import { ChangesetFileProps, ChangesetType, IModelError, ChangesetIndexOrId as PlatformChangesetIdOrIndex } from "@itwin/core-common";
import { Authorization, AuthorizationCallback, ChangesetPropertiesForCreate, ChangesetIdOrIndex as ClientChangesetIdOrIndex, ContainingChanges, LockLevel, LockedObjects, iModelPropertiesForCreateFromBaseline } from "@itwin/imodels-client-authoring";

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

  public static toiModelPropertiesForCreate(createNewiModelProps: CreateNewIModelProps, baselineFilePath: string): iModelPropertiesForCreateFromBaseline {
    return {
      projectId: createNewiModelProps.iTwinId,
      name: createNewiModelProps.iModelName,
      description: createNewiModelProps.description,
      filePath: baselineFilePath
    };
  }

  public static toLockedObjects(locks: LockMap): LockedObjects[] {
    const groupedLocks: Map<LockLevel, string[]> = PlatformToClientAdapter.groupLocksByLockLevel(locks);
    const result: LockedObjects[] = PlatformToClientAdapter.convertGroupedLocksToLockedObjects(groupedLocks);
    return result;
  }

  public static toContainingChanges(changesType: ChangesetType): ContainingChanges {
    switch (changesType) {
      case ChangesetType.Regular:
        return ContainingChanges.Regular;
      case ChangesetType.Schema:
        return ContainingChanges.Schema;
      default:
        throw new IModelError(RepositoryStatus.InvalidRequest, "Unsupported ContainingChanges");
    }
  }

  public static toAuthorization(accessToken: AccessToken): Authorization {
    const splitAccessToken = accessToken.split(" ");
    if (splitAccessToken.length !== 2)
      throw new IModelError(RepositoryStatus.InvalidRequest, "Unsupported access token format");

    return {
      scheme: splitAccessToken[0],
      token: splitAccessToken[1]
    };
  }

  public static toAuthorizationCallback(accessToken: AccessToken): AuthorizationCallback {
    const authorization: Authorization = PlatformToClientAdapter.toAuthorization(accessToken);
    return () => Promise.resolve(authorization);
  }

  public static toChangesetIdOrIndex(changeset: PlatformChangesetIdOrIndex): ClientChangesetIdOrIndex {
    if (changeset.id)
      return { changesetId: changeset.id };
    if (changeset.index)
      return { changesetIndex: changeset.index };

    throw new IModelError(RepositoryStatus.InvalidRequest, "Both changeset id and index are undefined");
  }

  private static toLockLevel(lockState: LockState): LockLevel {
    switch (lockState) {
      case LockState.None:
        return LockLevel.None;
      case LockState.Shared:
        return LockLevel.Shared;
      case LockState.Exclusive:
        return LockLevel.Exclusive;
      default:
        throw new IModelError(RepositoryStatus.InvalidRequest, "Unsupported LockState");
    }
  }

  private static groupLocksByLockLevel(locks: LockMap): Map<LockLevel, string[]> {
    const result: Map<LockLevel, string[]> = new Map();
    for (const objectId in locks) {
      const lockState: LockState = locks.get(objectId)!;
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
