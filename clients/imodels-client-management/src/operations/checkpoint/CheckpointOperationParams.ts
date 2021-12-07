/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelScopedOperationParams } from "../../base";

interface ChangesetIdParam {
  changesetId: string;
  changesetIndex?: never;
  namedVersionId?: never;
}

interface ChangesetIndexParam {
  changesetId?: never;
  changesetIndex: number;
  namedVersionId?: never;
}

interface NamedVersionIdParam {
  changesetId?: never;
  changesetIndex?: never;
  namedVersionId: string;
}

export type CheckpointParentEntityId = ChangesetIdParam | ChangesetIndexParam | NamedVersionIdParam;

export type GetSingleCheckpointParams = IModelScopedOperationParams & CheckpointParentEntityId;
