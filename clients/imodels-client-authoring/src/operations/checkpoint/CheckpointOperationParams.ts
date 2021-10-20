/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelScopedOperationParams } from "@itwin/imodels-client-management";

export interface GetCheckpointByChangesetIdParams extends iModelScopedOperationParams {
  changesetId: string;
}

export interface GetCheckpointByChangesetIndexParams extends iModelScopedOperationParams {
  changesetIndex: number;
}

export interface GetCheckpointByNamedVersionIdParams extends iModelScopedOperationParams {
  namedVersionId: string;
}
