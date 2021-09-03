/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContainingChanges, RequestContextParam } from "@itwin/imodels-client-management";

export interface CreateChangesetParams extends RequestContextParam {
  imodelId: string;
  changesetProperties: {
    id: string;
    parentId?: string;
    briefcaseId: number;
    description?: string;
    containingChanges: ContainingChanges;

    changesetFilePath: string;
  }
}