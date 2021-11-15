/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LockMap, LockState } from "@itwin/core-backend";
import { AccessToken, RepositoryStatus } from "@itwin/core-bentley";
import { ChangesetType, IModelError } from "@itwin/core-common";
import { Authorization, AuthorizationCallback, ContainingChanges, LockLevel, LockedObjects } from "@itwin/imodels-client-authoring";

export class PlatformToClientAdapter {
  public static toLockedObjects(locks: LockMap): LockedObjects[] {
    const result: LockedObjects[] = [];
    for (const objectId in locks) {
      const lockState: LockState = locks.get(objectId)!;
      const lockLevel: LockLevel = PlatformToClientAdapter.toLockLevel(lockState);

      const lockedObjectsForBriefcase: LockedObjects | undefined = result.find(set => set.lockLevel === lockLevel);
      if (lockedObjectsForBriefcase)
        lockedObjectsForBriefcase.objectIds.push(objectId);
      else
        result.push({ lockLevel, objectIds: [objectId] });
    }

    return result;
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
    return {
      scheme: splitAccessToken[0],
      token: splitAccessToken[1]
    };
  }

  public static toAuthorizationCallback(accessToken: AccessToken): AuthorizationCallback {
    const authorization: Authorization = PlatformToClientAdapter.toAuthorization(accessToken);
    return () => Promise.resolve(authorization);
  }
}
