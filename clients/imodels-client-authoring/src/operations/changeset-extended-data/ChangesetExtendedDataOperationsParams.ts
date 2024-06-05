/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetIdOrIndex, IModelScopedOperationParams } from "@itwin/imodels-client-management";

/** Properties that should be specified when creating a new Changeset Extended Data. */
export interface ChangesetExtendedDataPropertiesForCreate {
  /** Changeset application specific data. Maximum supported size is 204800 bytes. */
  data: object;
}

export interface ChangesetExtendedDataCreateRequest {
  /** Properties that should be specified when creating a new Changeset Extended Data. */
 changesetExtendedDataProperties: ChangesetExtendedDataPropertiesForCreate;
}

/** Parameters for create Changeset Extended Data operation. */
export type CreateChangesetExtendedDataParams = IModelScopedOperationParams & ChangesetExtendedDataCreateRequest & ChangesetIdOrIndex;
