/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { Briefcase, BriefcaseProperties, ChangesetProperties } from "@itwin/imodels-client-authoring";
import { iModelsError, iModelsErrorDetail, iModel, iModelState, iModelProperties, BaseEntity, Changeset, ChangesetState } from "@itwin/imodels-client-management";

export function assertBaseEntity(actualEntity: BaseEntity): void {
  expect(actualEntity).to.not.be.undefined;
  expect(actualEntity.id).to.not.be.empty;
  expect(actualEntity.displayName).to.not.be.empty;
}

export function assertiModel(params: {
  actualiModel: iModel,
  expectediModelProperties: iModelProperties
}): void {
  assertBaseEntity(params.actualiModel);

  expect(params.actualiModel.name).to.equal(params.expectediModelProperties.name);
  assertOptionalProperty(params.expectediModelProperties.description, params.actualiModel.description);
  assertOptionalProperty(params.expectediModelProperties.extent, params.actualiModel.extent);
  expect(params.actualiModel.createdDateTime as Date).to.not.be.undefined;
  expect(params.actualiModel.state).to.equal(iModelState.Initialized);
}

export function assertBriefcase(params: {
  actualBriefcase: Briefcase,
  expectedBriefcaseProperties: BriefcaseProperties
}): void {
  assertBaseEntity(params.actualBriefcase);

  expect(params.actualBriefcase.briefcaseId).to.be.greaterThan(0);
  expect(params.actualBriefcase.fileSize).to.be.greaterThan(0);
  assertOptionalProperty(params.expectedBriefcaseProperties?.deviceName, params.actualBriefcase.deviceName);
  expect(params.actualBriefcase.acquiredDateTime as Date).to.not.be.undefined;
}

export function assertChangeset(params: {
  actualChangeset: Changeset,
  expectedChangesetProperties: ChangesetProperties
}): void {
  assertBaseEntity(params.actualChangeset);

  expect(params.actualChangeset.parentId).to.equal(params.expectedChangesetProperties.parentId ?? "");
  expect(params.actualChangeset.fileSize).to.equal(fs.statSync(params.expectedChangesetProperties.changesetFilePath).size);
  expect(params.actualChangeset.index).to.be.greaterThan(0);
  expect(params.actualChangeset.briefcaseId).to.be.greaterThan(0);
  assertOptionalProperty(params.expectedChangesetProperties.description, params.actualChangeset.description);
  expect(params.actualChangeset.pushDateTime as Date).to.not.be.undefined;
  expect(params.actualChangeset.state).to.equal(ChangesetState.FileUploaded);
  expect(params.actualChangeset.synchronizationInfo).to.equal(null);

  // TODO: add correct expected value when test client is set up
  // expect(params.actualChangeset.application).to.equal(null);
}

export function assertError(params: { actualError: Error, expectedError: Partial<iModelsError> }): void {
  const imodelsError = params.actualError as iModelsError;

  expect(imodelsError).to.not.be.undefined;
  expect(imodelsError.code).to.equal(params.expectedError.code);
  expect(imodelsError.name).to.equal(params.expectedError.code);
  expect(imodelsError.message).to.equal(params.expectedError.message);

  if (params.expectedError.details) {
    expect(imodelsError.details.length).to.equal(params.expectedError.details.length);

    for (const expectedDetail of params.expectedError.details) {
      const detailVerificationFunc = (detail: iModelsErrorDetail) =>
        detail.code === expectedDetail.code &&
        detail.message === expectedDetail.message &&
        detail.target === expectedDetail.target;
      expect(imodelsError.details.find(detailVerificationFunc)).to.not.be.undefined;
    }
  } else {
    expect(imodelsError.details).to.be.undefined;
  }
}

function assertOptionalProperty<TPropertyType>(expectedValue: TPropertyType, actualValue: TPropertyType): void {
  if (expectedValue)
    expect(actualValue).to.deep.equal(expectedValue);
  else
    expect(actualValue).to.equal(null);
}
