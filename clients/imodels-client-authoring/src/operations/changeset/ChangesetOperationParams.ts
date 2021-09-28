/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContainingChanges, GetChangesetListParams, iModelScopedOperationParams } from "@itwin/imodels-client-management";

export interface ChangesetProperties {
  id: string;
  description?: string;
  parentId?: string;
  briefcaseId: number;
  containingChanges?: ContainingChanges;
  changesetFilePath: string;
}

export interface CreateChangesetParams extends iModelScopedOperationParams {
  changesetProperties: ChangesetProperties;
}

export interface DownloadChangesetsParams extends GetChangesetListParams {
  targetPath: string;
}
