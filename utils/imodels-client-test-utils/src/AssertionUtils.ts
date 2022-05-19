/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { BaselineFile, BaselineFileState, Briefcase, BriefcaseProperties, Changeset, ChangesetPropertiesForCreate, ChangesetState, Checkpoint, CheckpointState, DownloadedChangeset, EntityListIterator, IModel, IModelProperties, IModelState, IModelsError, IModelsErrorDetail, Lock, NamedVersion, NamedVersionPropertiesForCreate, NamedVersionState } from "@itwin/imodels-client-authoring";
import { TestChangesetFile, TestIModelBaselineFile } from "./test-context-providers";

export async function assertCollection<T>(params: {
  asyncIterable: EntityListIterator<T>;
  isEntityCountCorrect: (count: number) => boolean;
}): Promise<void> {
  let entityCount = 0;
  for await (const entity of params.asyncIterable) {
    expect(entity).to.not.be.undefined;
    entityCount++;
  }
  expect(params.isEntityCountCorrect(entityCount)).to.equal(true);
}

export function assertIModel(params: {
  actualIModel: IModel;
  expectedIModelProperties: IModelProperties;
}): void {
  expect(params.actualIModel).to.not.be.undefined;
  expect(params.actualIModel.id).to.not.be.empty;
  expect(params.actualIModel.displayName).to.not.be.empty;

  expect(params.actualIModel.name).to.equal(params.expectedIModelProperties.name);
  assertOptionalProperty(params.expectedIModelProperties.description, params.actualIModel.description);
  assertOptionalProperty(params.expectedIModelProperties.extent, params.actualIModel.extent);
  expect(params.actualIModel.createdDateTime).to.not.be.empty;
  expect(params.actualIModel.state).to.equal(IModelState.Initialized);
}

export async function assertBaselineFile(params: {
  actualBaselineFile: BaselineFile;
  expectedBaselineFileProperties: {
    state: BaselineFileState;
  };
  expectedTestBaselineFile: TestIModelBaselineFile;
}): Promise<void> {
  expect(params.actualBaselineFile).to.not.be.undefined;
  expect(params.actualBaselineFile.id).to.not.be.empty;
  expect(params.actualBaselineFile.displayName).to.not.be.empty;

  expect(params.actualBaselineFile.state).to.be.equal(params.expectedBaselineFileProperties.state);

  const expectedFileStats = await fs.promises.stat(params.expectedTestBaselineFile.filePath);
  expect(params.actualBaselineFile.fileSize).to.equal(expectedFileStats.size);

  expect(params.actualBaselineFile._links).to.not.be.undefined;
  expect(params.actualBaselineFile._links.creator).to.not.be.undefined;
  expect(params.actualBaselineFile._links.creator.href).to.not.be.empty;
  expect(params.actualBaselineFile._links.download).to.not.be.undefined;
  expect(params.actualBaselineFile._links.download!.href).to.not.be.empty;
}

export function assertBriefcase(params: {
  actualBriefcase: Briefcase;
  expectedBriefcaseProperties: BriefcaseProperties & { briefcaseId?: number };
}): void {
  expect(params.actualBriefcase).to.not.be.undefined;
  expect(params.actualBriefcase.id).to.not.be.empty;
  expect(params.actualBriefcase.displayName).to.not.be.empty;
  expect(params.actualBriefcase.ownerId).to.not.be.empty;
  expect(params.actualBriefcase.acquiredDateTime).to.not.be.empty;

  if (params.expectedBriefcaseProperties.briefcaseId)
    expect(params.actualBriefcase.briefcaseId).to.equal(params.expectedBriefcaseProperties.briefcaseId);
  else
    expect(params.actualBriefcase.briefcaseId).to.be.greaterThan(0);

  expect(params.actualBriefcase.fileSize).to.be.greaterThan(0);
  assertOptionalProperty(params.expectedBriefcaseProperties?.deviceName, params.actualBriefcase.deviceName);

  expect(params.actualBriefcase.application).to.not.be.undefined;
  expect(params.actualBriefcase.application!.id).to.not.be.empty;
  expect(params.actualBriefcase.application!.name).to.not.be.empty;

  expect(params.actualBriefcase._links).to.not.be.undefined;
  expect(params.actualBriefcase._links.owner).to.not.be.undefined;
  expect(params.actualBriefcase._links.owner.href).to.not.be.empty;
}

export function assertChangeset(params: {
  actualChangeset: Changeset;
  expectedChangesetProperties: Partial<ChangesetPropertiesForCreate>;
  expectedTestChangesetFile: TestChangesetFile;
}): void {
  expect(params.actualChangeset).to.not.be.undefined;
  expect(params.actualChangeset.id).to.not.be.empty;
  expect(params.actualChangeset.displayName).to.not.be.empty;

  expect(params.actualChangeset.parentId).to.equal(params.expectedChangesetProperties.parentId ?? "");
  expect(params.actualChangeset.index).to.be.greaterThan(0);
  expect(params.actualChangeset.briefcaseId).to.be.greaterThan(0);
  assertOptionalProperty(params.expectedChangesetProperties.description, params.actualChangeset.description);
  expect(params.actualChangeset.creatorId).to.not.be.undefined;
  expect(params.actualChangeset.pushDateTime).to.not.be.empty;
  expect(params.actualChangeset.state).to.equal(ChangesetState.FileUploaded);
  expect(params.actualChangeset.synchronizationInfo).to.equal(null);

  // Check if the changeset.fileSize property matches the size of the changeset file used for test iModel creation
  expect(params.actualChangeset.fileSize).to.equal(fs.statSync(params.expectedTestChangesetFile.filePath).size);

  expect(params.actualChangeset.application).to.not.be.undefined;
  expect(params.actualChangeset.application!.id).to.not.be.empty;
  expect(params.actualChangeset.application!.name).to.not.be.empty;
}

export function assertDownloadedChangeset(params: {
  actualChangeset: DownloadedChangeset;
  expectedChangesetProperties: Partial<ChangesetPropertiesForCreate>;
  expectedTestChangesetFile: TestChangesetFile;
}): void {
  assertChangeset(params);

  expect(fs.existsSync(params.actualChangeset.filePath)).to.equal(true);

  // Check if the downloaded file size matches the size of the changeset file used for test iModel creation
  expect(fs.statSync(params.actualChangeset.filePath).size).to.equal(fs.statSync(params.expectedTestChangesetFile.filePath).size);
}

export function assertNamedVersion(params: {
  actualNamedVersion: NamedVersion;
  expectedNamedVersionProperties: NamedVersionPropertiesForCreate & { changesetIndex: number };
}): void {
  expect(params.actualNamedVersion).to.not.be.undefined;
  expect(params.actualNamedVersion.id).to.not.be.empty;
  expect(params.actualNamedVersion.displayName).to.not.be.empty;

  expect(params.actualNamedVersion.name).to.equal(params.expectedNamedVersionProperties.name);
  assertOptionalProperty(params.expectedNamedVersionProperties.description, params.actualNamedVersion.description);
  assertOptionalProperty(params.expectedNamedVersionProperties.changesetId, params.actualNamedVersion.changesetId);
  expect(params.actualNamedVersion.changesetIndex).to.equal(params.expectedNamedVersionProperties.changesetIndex);
  expect(params.actualNamedVersion.state).to.equal(NamedVersionState.Visible);
}

export function assertCheckpoint(params: {
  actualCheckpoint: Checkpoint;
  expectedCheckpointProperties: {
    changesetId: string;
    changesetIndex: number;
    state: CheckpointState;
  };
}): void {
  expect(params.actualCheckpoint.changesetId).to.equal(params.expectedCheckpointProperties.changesetId);
  expect(params.actualCheckpoint.changesetIndex).to.equal(params.expectedCheckpointProperties.changesetIndex);
  expect(params.actualCheckpoint.state).to.equal(params.expectedCheckpointProperties.state);

  expect(params.actualCheckpoint.containerAccessInfo).to.not.be.null;
  expect(params.actualCheckpoint.containerAccessInfo!.account).to.not.be.empty;
  expect(params.actualCheckpoint.containerAccessInfo!.sas).to.not.be.empty;
  expect(params.actualCheckpoint.containerAccessInfo!.container).to.not.be.empty;
  expect(params.actualCheckpoint.containerAccessInfo!.dbName).to.not.be.empty;

  expect(params.actualCheckpoint._links?.download).to.not.be.empty;
}

export function assertLock(params: {
  actualLock: Lock;
  expectedLock: Lock;
}): void {
  expect(params.actualLock.briefcaseId).to.equal(params.expectedLock.briefcaseId);

  expect(params.actualLock.lockedObjects.length).to.equal(params.expectedLock.lockedObjects.length);
  for (const lockedObjects of params.actualLock.lockedObjects) {
    const expectedLockedObjects = params.expectedLock.lockedObjects.find((l) => l.lockLevel === lockedObjects.lockLevel);
    expect(expectedLockedObjects).to.be.not.be.undefined;

    expect(lockedObjects.objectIds.length).to.equal(expectedLockedObjects!.objectIds.length);
    for (const objectId of lockedObjects.objectIds) {
      const expectedLockedObjectId = expectedLockedObjects!.objectIds.find((id) => id === objectId);
      expect(expectedLockedObjectId).to.not.be.undefined;
    }
  }
}

export function assertError(params: { objectThrown: unknown, expectedError: Partial<IModelsError> }): void {
  expect(params.objectThrown).is.not.undefined;
  expect(params.objectThrown instanceof Error);

  const iModelsError = params.objectThrown as IModelsError;
  expect(iModelsError).to.not.be.undefined;
  expect(iModelsError.code).to.equal(params.expectedError.code);
  expect(iModelsError.name).to.equal(params.expectedError.code);
  expect(iModelsError.message).to.equal(params.expectedError.message);

  if (params.expectedError.details) {
    expect(iModelsError.details).to.not.be.undefined;
    expect(iModelsError.details!.length).to.equal(params.expectedError.details.length);

    for (const expectedDetail of params.expectedError.details) {
      const detailVerificationFunc = (detail: IModelsErrorDetail) =>
        detail.code === expectedDetail.code &&
        detail.message === expectedDetail.message &&
        detail.target === expectedDetail.target;
      expect(iModelsError.details!.find(detailVerificationFunc)).to.not.be.undefined;
    }
  } else {
    expect(iModelsError.details).to.be.undefined;
  }
}

function assertOptionalProperty<TPropertyType>(expectedValue: TPropertyType, actualValue: TPropertyType): void {
  if (expectedValue)
    expect(actualValue).to.deep.equal(expectedValue);
  else
    expect(actualValue).to.equal(null);
}
