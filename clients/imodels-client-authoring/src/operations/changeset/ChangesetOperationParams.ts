/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ContainingChanges,
  GetChangesetListParams,
  GetSingleChangesetParams,
  IModelScopedOperationParams,
  SynchronizationInfo,
} from "@itwin/imodels-client-management";

import { DownloadProgressParam, TargetDirectoryParam } from "../../base/types";

export type SynchronizationInfoForCreate = Omit<
  SynchronizationInfo,
  "changedFiles"
> & {
  /** Optional list of files that were processed by the synchronization. The array, if specified, must not be empty. */
  changedFiles?: string[];
};

/** Properties that should be specified when creating a new Changeset. */
export interface ChangesetPropertiesForCreate {
  /** Changeset id. Changeset id must not be an empty or whitespace string. */
  id: string;
  /** Changeset description. Changeset description must not exceed allowed 255 characters. */
  description?: string;
  /**
   * Id of the parent Changeset. Parent Changeset id must not be an empty or whitespace string except for when creating the
   * first Changeset - in such case it can be `undefined`.
   */
  parentId?: string;
  /** Briefcase id that is creating the Changeset. Briefcase id must be greater than 0. */
  briefcaseId: number;
  /**
   * Type of changes that the Changeset contains. This property is flag value, therefore all change types, except
   * Schema and SchemaSync, can be combined See {@link ContainingChanges}.
   */
  containingChanges?: ContainingChanges;
  /** Information about the current synchronization process that is creating the changeset. */
  synchronizationInfo?: SynchronizationInfoForCreate;
  /** Absolute path of the Changeset file. The file must exist. */
  filePath: string;
  /**
   * Id of the Changeset Group that the Changeset belongs to.
   * `undefined` if the Changeset does not belong to a Changeset Group.
   */
  groupId?: string;
}

/** Parameters for create Changeset operation. */
export interface CreateChangesetParams extends IModelScopedOperationParams {
  /** Properties of the new Changeset. */
  changesetProperties: ChangesetPropertiesForCreate;
}

/** Parameters for single Changeset download operation. */
export type DownloadSingleChangesetParams = GetSingleChangesetParams &
  TargetDirectoryParam &
  DownloadProgressParam;

/** Parameters for Changeset list download operation. */
export type DownloadChangesetListParams = GetChangesetListParams &
  TargetDirectoryParam &
  DownloadProgressParam;
