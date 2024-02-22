/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { Briefcase, Changeset, ChangesetGroup, Checkpoint, IModel, MinimalChangeset, NamedVersion, User } from "@itwin/imodels-client-authoring";

import { assertUser } from "./BrowserFriendlyAssertions";

export async function assertIModelCallbacks(params: {
  iModel: IModel;
}): Promise<void> {
  expect(params.iModel.getCreator).to.exist;

  const creator: User | undefined = await params.iModel.getCreator();
  assertUser({
    actualUser: creator!
  });
}

export async function assertBriefcaseCallbacks(params: {
  briefcase: Briefcase;
}): Promise<void> {
  expect(params.briefcase.getOwner).to.exist;

  const owner: User | undefined = await params.briefcase.getOwner();
  assertUser({
    actualUser: owner!
  });
}

export async function assertMinimalChangesetCallbacks(params: {
  changeset: MinimalChangeset;
}): Promise<void> {
  expect(params.changeset.getCreator).to.exist;

  const creator: User | undefined = await params.changeset.getCreator();
  assertUser({
    actualUser: creator!
  });
}

export async function assertChangesetCallbacks(params: {
  changeset: Changeset;
  shouldNamedVersionExist: boolean;
  shouldCheckpointExist: boolean;
}): Promise<void> {
  await assertMinimalChangesetCallbacks({
    changeset: params.changeset
  });

  expect(params.changeset.getNamedVersion).to.exist;
  const namedVersion: NamedVersion | undefined = await params.changeset.getNamedVersion();
  if (params.shouldNamedVersionExist)
    expect(namedVersion).to.exist;
  else
    expect(namedVersion).to.be.undefined;

  expect(params.changeset.getCurrentOrPrecedingCheckpoint).to.exist;
  const checkpoint: Checkpoint | undefined = await params.changeset.getCurrentOrPrecedingCheckpoint();
  if (params.shouldCheckpointExist)
    expect(checkpoint).to.exist;
  else
    expect(checkpoint).to.be.undefined;
}

export async function assertChangesetGroupCallbacks(params: {
  changesetGroup: ChangesetGroup;
}): Promise<void> {
  expect(params.changesetGroup.getCreator).to.exist;

  const creator: User | undefined = await params.changesetGroup.getCreator();
  assertUser({
    actualUser: creator!
  });
}

export async function assertNamedVersionCallbacks(params: {
  namedVersion: NamedVersion;
  shouldChangesetExist: boolean;
}): Promise<void> {
  const creator: User | undefined = await params.namedVersion.getCreator();
  assertUser({
    actualUser: creator!
  });

  const changeset: Changeset | undefined = await params.namedVersion.getChangeset();
  if (params.shouldChangesetExist)
    expect(changeset).to.exist;
  else
    expect(changeset).to.be.undefined;
}
