/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelsError, iModelsErrorDetail, iModel, iModelState, iModelProperties } from "@itwin/imodels-client-management";

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

export function assertiModel(params: { actualiModel: iModel, expectediModelProperties: iModelProperties & { state?: iModelState } }): void {
  expect(params.actualiModel).to.not.be.undefined;
  expect(params.actualiModel.name).to.equal(params.expectediModelProperties.name);

  assertOptionalProperty(params.expectediModelProperties.description, params.actualiModel.description);
  assertOptionalProperty(params.expectediModelProperties.extent, params.actualiModel.extent);

  expect(params.actualiModel.createdDateTime as Date).to.not.be.undefined;
  if (params.expectediModelProperties.state)
    expect(params.actualiModel.state).to.equal(iModelState.Initialized);
}

function assertOptionalProperty<TPropertyType>(expectedValue: TPropertyType, actualValue: TPropertyType): void {
  if (expectedValue)
    expect(actualValue).to.deep.equal(expectedValue);
  else
    expect(actualValue).to.equal(null);
}
