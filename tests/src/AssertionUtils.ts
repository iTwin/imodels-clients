import { iModelsError, iModelsErrorDetail, iModel, iModelProperties } from "@itwin/imodels-client-management";
import { expect } from "chai";

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

export function assertiModel(params: { actualiModel: iModel, expectediModelProperties: iModelProperties }): void {
  expect(params.actualiModel).to.not.be.undefined;
  expect(params.actualiModel.name).to.equal(params.expectediModelProperties.name);
  expect(params.actualiModel.description).to.equal(params.expectediModelProperties.description);
  expect(params.actualiModel.extent).to.deep.equal(params.expectediModelProperties.extent);
}