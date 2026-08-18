/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { ChangesetType } from "@itwin/core-common";
import { ClientToPlatformAdapter } from "@itwin/imodels-access-backend/lib/cjs/interface-adapters/ClientToPlatformAdapter";
import {
  ContainingChanges,
  MinimalChangeset,
} from "@itwin/imodels-client-management";

describe("ClientToPlatformAdapter", () => {
  it("should map Schema and SchemaSync flags to SchemaSync", () => {
    const changeset = {
      containingChanges:
        ContainingChanges.Schema | ContainingChanges.SchemaSync,
    } as MinimalChangeset;

    const changesetProperties =
      ClientToPlatformAdapter.toChangesetProps(changeset);

    expect(changesetProperties.changesType).to.equal(ChangesetType.SchemaSync);
  });
});
