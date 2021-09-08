/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContainingChanges, RequestContextParam } from "@itwin/imodels-client-management";

export interface ChangesetProperties {
  briefcaseId: number;
  id: string;
  parentId?: string;
  description?: string;
  containingChanges?: ContainingChanges;

  changesetFilePath: string;
}

export interface CreateChangesetParams extends RequestContextParam {
  imodelId: string;
  changesetProperties: ChangesetProperties;
}
