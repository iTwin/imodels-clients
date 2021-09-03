/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetOperations as ManagementChangesetOperations } from "@itwin/imodels-client-management";
import { Changeset } from "@itwin/imodels-client-management";

export class ChangesetOperations extends ManagementChangesetOperations {
  public create(): Promise<Changeset> {
    
  }
}