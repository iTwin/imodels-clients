/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, Link } from "@itwin/imodels-client-management";

export interface ChangesetLinks {
  upload: Link;
  complete: Link;
}

export interface ChangesetCreateResponse {
  changeset: Changeset & { _links: ChangesetLinks };
}
