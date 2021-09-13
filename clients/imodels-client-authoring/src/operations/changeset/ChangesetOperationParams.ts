/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContainingChanges, iModelScopedOperationParams } from "@itwin/imodels-client-management";

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
