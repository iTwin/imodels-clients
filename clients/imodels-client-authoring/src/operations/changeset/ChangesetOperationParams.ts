/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContainingChanges, GetChangesetListUrlParams, GetSingleChangesetParams, iModelScopedOperationParams } from "@itwin/imodels-client-management";
import { TargetDirectoryParam } from "../../base";

export interface ChangesetPropertiesForCreate {
  id: string;
  description?: string;
  parentId?: string;
  briefcaseId: number;
  containingChanges?: ContainingChanges;
  filePath: string;
}

export interface CreateChangesetParams extends iModelScopedOperationParams {
  changesetProperties: ChangesetPropertiesForCreate;
}

export type DownloadSingleChangesetParams = GetSingleChangesetParams & TargetDirectoryParam;

export type DownloadChangesetListParams = iModelScopedOperationParams & TargetDirectoryParam & { urlParams?: Omit<GetChangesetListUrlParams, "$skip"> };
