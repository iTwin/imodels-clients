/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelScopedOperationParams } from "@itwin/imodels-client-management";

import { LockedObjects } from "../../base/types";

/** Parameters for update Lock operation. */
export interface UpdateLockParams extends IModelScopedOperationParams {
  /** Id of the Briefcase to update Locks for. */
  briefcaseId: number;
  /**
   * Id of the latest Changeset in which the locked object was updated. If this value points to an older Changeset than
   * the value saved in the server acquiring locks will fail. Such state indicates that an object may have been updated
   * and the local Briefcase does not have the latest changes.
   */
  changesetId?: string;
  /** Ids of the locked objects grouped by their lock level. See {@link LockedObjects}. */
  lockedObjects: LockedObjects[];
}
