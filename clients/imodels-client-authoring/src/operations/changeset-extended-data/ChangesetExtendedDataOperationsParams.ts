/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetIdOrIndex, IModelScopedOperationParams } from "@itwin/imodels-client-management";

/** Properties that should be specified when creating a new Changeset Extended Data. */
export interface ChangesetExtendedDataPropertiesForCreate {
  /** Changeset Extended Data data property. Application specific valid json object. Maximum supported size is 204800 bytes. */
  data: object;
}

/** Parameters for create Changeset Extended Data operation. */
export interface CreateChangesetExtendedDataParams extends IModelScopedOperationParams {
  /** Changeset identified by either Changeset index or id */
  changeset: ChangesetIdOrIndex;
  /** Changeset Extended Data Create properties. */
  changesetExtendedDataProperties: ChangesetExtendedDataPropertiesForCreate;
}
