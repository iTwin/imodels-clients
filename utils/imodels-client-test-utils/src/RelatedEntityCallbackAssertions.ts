/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, Changeset, Checkpoint, MinimalChangeset, NamedVersion, User } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { assertUser } from "./AssertionUtils";

export async function assertBriefcaseCallbacks(params: {
  briefcase: Briefcase
}): Promise<void> {
  expect(params.briefcase.getOwner).to.exist;

  const owner: User | undefined = await params.briefcase.getOwner();
  assertUser({
    actualUser: owner!
  });
}

export async function assertMinimalChangesetCallbacks(params: {
  changeset: MinimalChangeset
}): Promise<void> {
  expect(params.changeset.getCreator).to.exist;

  const creator: User | undefined = await params.changeset.getCreator();
  assertUser({
    actualUser: creator!
  });
};

export async function assertChangesetCallbacks(params: {
  changeset: Changeset,
  namedVersionProperties: {
    shouldExist: boolean
  }
  checkpointProperties: {
    changesetIndex: number
  }
}): Promise<void> {
  await assertMinimalChangesetCallbacks({
    changeset: params.changeset
  });

  expect(params.changeset.getNamedVersion).to.exist;
  const namedVersion: NamedVersion | undefined = await params.changeset.getNamedVersion();
  if (params.namedVersionProperties.shouldExist)
    expect(namedVersion).to.exist;
  else
    expect(namedVersion).to.be.undefined;

  expect(params.changeset.getCurrentOrPrecedingCheckpoint).to.exist;
  const checkpoint: Checkpoint | undefined = await params.changeset.getCurrentOrPrecedingCheckpoint();
  expect(checkpoint).to.exist;
  expect(checkpoint!.changesetIndex).to.be.equal(params.checkpointProperties.changesetIndex);
}

export async function assertNamedVersionCallbacks(params: {
  namedVersion: NamedVersion,
  changesetProperties: {
    shouldExist: boolean
  }
}): Promise<void> {
  const creator: User | undefined = await params.namedVersion.getCreator();
  assertUser({
    actualUser: creator!
  });

  const changeset: Changeset | undefined = await params.namedVersion.getChangeset();
  if (params.changesetProperties.shouldExist)
    expect(changeset).to.exist;
  else
    expect(changeset).to.be.undefined;
}