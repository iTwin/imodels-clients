/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { BaselineFile, BaselineFileState, Changeset, ChangesetPropertiesForCreate, ChangesetState, DownloadedChangeset, Lock, MinimalChangeset, SynchronizationInfo, SynchronizationInfoForCreate } from "@itwin/imodels-client-authoring";
import { TestChangesetFile, TestIModelBaselineFile } from "../test-context-providers";
import { assertApplication, assertOptionalLink, assertOptionalProperty } from "./BrowserFriendlyAssertions";
import { assertChangesetCallbacks, assertMinimalChangesetCallbacks } from "./RelatedEntityCallbackAssertions";

export async function assertBaselineFile(params: {
  actualBaselineFile: BaselineFile;
  expectedBaselineFileProperties: {
    state: BaselineFileState;
  };
  expectedTestBaselineFile: TestIModelBaselineFile;
}): Promise<void> {
  expect(params.actualBaselineFile).to.exist;
  expect(params.actualBaselineFile.id).to.not.be.empty;
  expect(params.actualBaselineFile.displayName).to.not.be.empty;

  expect(params.actualBaselineFile.state).to.be.equal(params.expectedBaselineFileProperties.state);

  const expectedFileStats = await fs.promises.stat(params.expectedTestBaselineFile.filePath);
  expect(params.actualBaselineFile.fileSize).to.equal(expectedFileStats.size);

  expect(params.actualBaselineFile._links).to.exist;
  expect(params.actualBaselineFile._links.creator).to.exist;
  expect(params.actualBaselineFile._links.creator.href).to.not.be.empty;
  expect(params.actualBaselineFile._links.download).to.exist;
  expect(params.actualBaselineFile._links.download!.href).to.not.be.empty;
}

export async function assertMinimalChangeset(params: {
  actualChangeset: MinimalChangeset;
  expectedChangesetProperties: Partial<ChangesetPropertiesForCreate>;
  expectedTestChangesetFile: Omit<TestChangesetFile, "synchronizationInfo">;
}): Promise<void> {
  expect(params.actualChangeset).to.exist;
  expect(params.actualChangeset.id).to.not.be.empty;
  expect(params.actualChangeset.displayName).to.not.be.empty;

  expect(params.actualChangeset.parentId).to.equal(params.expectedChangesetProperties.parentId ?? "");
  expect(params.actualChangeset.index).to.be.greaterThan(0);
  expect(params.actualChangeset.briefcaseId).to.be.greaterThan(0);
  assertOptionalProperty(params.expectedChangesetProperties.description, params.actualChangeset.description);
  expect(params.actualChangeset.creatorId).to.exist;
  expect(params.actualChangeset.pushDateTime).to.not.be.empty;
  expect(params.actualChangeset.state).to.equal(ChangesetState.FileUploaded);

  // Check if the changeset.fileSize property matches the size of the changeset file used for test iModel creation
  expect(params.actualChangeset.fileSize).to.equal(fs.statSync(params.expectedTestChangesetFile.filePath).size);

  expect(params.actualChangeset._links).to.exist;
  expect(params.actualChangeset._links.self).to.exist;
  expect(params.actualChangeset._links.self.href).to.not.be.empty;
  expect(params.actualChangeset._links.creator).to.exist;
  expect(params.actualChangeset._links.creator.href).to.not.be.empty;

  await assertMinimalChangesetCallbacks({
    changeset: params.actualChangeset
  });
}

export async function assertChangeset(params: {
  actualChangeset: Changeset;
  expectedChangesetProperties: Partial<ChangesetPropertiesForCreate>;
  expectedTestChangesetFile: TestChangesetFile;
  expectedLinks: {
    namedVersion: boolean;
    checkpoint: boolean;
  };
  isGetResponse: boolean;
}): Promise<void> {
  await assertMinimalChangeset({
    actualChangeset: params.actualChangeset,
    expectedChangesetProperties: params.expectedChangesetProperties,
    expectedTestChangesetFile: params.expectedTestChangesetFile
  });

  assertApplication({
    actualApplication: params.actualChangeset.application,
    isGetResponse: params.isGetResponse
  });

  assertSynchronizationInfo({
    actualSynchronizationInfo: params.actualChangeset.synchronizationInfo,
    expectedSynchronizationInfo: params.expectedChangesetProperties.synchronizationInfo,
    isGetResponse: params.isGetResponse
  });

  assertOptionalLink({
    actualLink: params.actualChangeset._links.namedVersion,
    shouldLinkExist: params.expectedLinks.namedVersion
  });

  assertOptionalLink({
    actualLink: params.actualChangeset._links.currentOrPrecedingCheckpoint,
    shouldLinkExist: params.expectedLinks.checkpoint
  });

  if (params.isGetResponse) {
    expect(params.actualChangeset._links.download).to.exist;
    expect(params.actualChangeset._links.download.href).to.not.be.empty;
  } else {
    // `download` link is not present in `create` method result.
    expect(params.actualChangeset._links.download).to.be.undefined;
  }

  await assertChangesetCallbacks({
    changeset: params.actualChangeset,
    shouldNamedVersionExist: params.expectedLinks.namedVersion,
    shouldCheckpointExist: params.expectedLinks.checkpoint
  });
}

export async function assertDownloadedChangeset(params: {
  actualChangeset: DownloadedChangeset;
  expectedChangesetProperties: Partial<ChangesetPropertiesForCreate>;
  expectedTestChangesetFile: TestChangesetFile;
  expectedLinks: {
    namedVersion: boolean;
    checkpoint: boolean;
  };
}): Promise<void> {
  await assertChangeset({
    ...params,
    isGetResponse: true
  });

  expect(fs.existsSync(params.actualChangeset.filePath)).to.equal(true);

  // Check if the downloaded file size matches the size of the changeset file used for test iModel creation
  expect(fs.statSync(params.actualChangeset.filePath).size).to.equal(fs.statSync(params.expectedTestChangesetFile.filePath).size);
}

export function assertLock(params: {
  actualLock: Lock;
  expectedLock: Lock;
}): void {
  expect(params.actualLock.briefcaseId).to.equal(params.expectedLock.briefcaseId);

  expect(params.actualLock.lockedObjects.length).to.equal(params.expectedLock.lockedObjects.length);
  for (const lockedObjects of params.actualLock.lockedObjects) {
    const expectedLockedObjects = params.expectedLock.lockedObjects.find((l) => l.lockLevel === lockedObjects.lockLevel);
    expect(expectedLockedObjects).to.exist;

    expect(lockedObjects.objectIds.length).to.equal(expectedLockedObjects!.objectIds.length);
    for (const objectId of lockedObjects.objectIds) {
      const expectedLockedObjectId = expectedLockedObjects!.objectIds.find((id) => id === objectId);
      expect(expectedLockedObjectId).to.exist;
    }
  }
}

function assertSynchronizationInfo(params: {
  actualSynchronizationInfo: SynchronizationInfo | null;
  expectedSynchronizationInfo: SynchronizationInfoForCreate | undefined;
  isGetResponse: boolean;
}): void {
  // TODO: remove the conditional `synchronizationInfo` assertion when the API is fixed to return this
  // information in POST/PATCH responses.
  if (!params.isGetResponse) {
    expect(params.actualSynchronizationInfo).to.equal(null);
    return;
  }

  if (params.expectedSynchronizationInfo) {
    expect(params.actualSynchronizationInfo).to.exist;
    expect(params.actualSynchronizationInfo!.taskId).to.be.equal(params.expectedSynchronizationInfo.taskId);

    if (params.expectedSynchronizationInfo.changedFiles)
      expect(params.actualSynchronizationInfo!.changedFiles).to.deep.equal(params.expectedSynchronizationInfo.changedFiles);
    else
      expect(params.actualSynchronizationInfo!.changedFiles).to.equal(null);

    return;
  }

  expect(params.actualSynchronizationInfo).to.be.equal(null);
}
