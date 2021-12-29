/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContainingChanges, GetChangesetListParams, GetSingleChangesetParams, IModelScopedOperationParams } from "@itwin/imodels-client-management";
import { TargetDirectoryParam } from "../../base";

/** Properties that should be specified when creating a new Changeset. */
export interface ChangesetPropertiesForCreate {
  /** Changeset id. Changeset id must not be an empty or whitespace string. */
  id: string;
  /** Changeset description. Changeset description must not exceed allowed 255 characters. */
  description?: string;
  /**
   * Parent Changeset id. Parent Changeset id must not be an empty or whitespace string except for when creating the
   * first Changeset - in such case it can be `undefined`.
   */
  parentId?: string;
  /** Briefcase id that is creating the Changeset. Briefcase id must be greater than 0. */
  briefcaseId: number;
  /**
   * Type of changes that the Changeset contains. This property is flag value, therefore all change types, except
   * Schema, can be combined See {@link ContainingChanges}.
   */
  containingChanges?: ContainingChanges;
  /** Absolute path of the Changeset file. The file must exist. */
  filePath: string;
}

/** Parameters for create Changeset operation. */
export interface CreateChangesetParams extends IModelScopedOperationParams {
  /** Properties of the new Changeset. */
  changesetProperties: ChangesetPropertiesForCreate;
}

/** Parameters for single Changeset download operation. */
export type DownloadSingleChangesetParams = GetSingleChangesetParams & TargetDirectoryParam;

/** Parameters for Changeset list download operation. */
export type DownloadChangesetListParams = GetChangesetListParams & TargetDirectoryParam;
