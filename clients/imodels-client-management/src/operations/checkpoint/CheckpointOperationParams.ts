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

/**
 * Supported Checkpoint parent entity (Changeset, Named Version) identifiers. Only one of the following properties can
 * be specified to reference a single Checkpoint by its parent entity: `changesetId`, `changesetIndex`, `namedVersionId`.
 */
export type CheckpointParentEntityId = ChangesetIdParam | ChangesetIndexParam | NamedVersionIdParam;

/** Parameters for get single Checkpoint operation. */
export type GetSingleCheckpointParams = IModelScopedOperationParams & CheckpointParentEntityId;
