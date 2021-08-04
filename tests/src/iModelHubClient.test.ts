/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { Extent, iModel, iModelsClient, iModelsError, iModelsErrorCode, iModelsErrorDetail } from "@itwin/imodels-client-management";

import { cleanUpiModelsAfterTestRun } from "./CommonTestUtils";

describe("iModelsClient", () => {
  let accessToken: string;
  let testProjectId: string;
  let imodelsClient: iModelsClient;

  const imodelsPrefixForTestSuite = "[iModelsClient Tests]";

  before(() => {
    testProjectId = ""; // TODO: read config
    accessToken = ""; // TODO: read config
    imodelsClient = new iModelsClient();
  });

  after(async () => {
    return cleanUpiModelsAfterTestRun(imodelsPrefixForTestSuite, imodelsClient, { accessToken: accessToken }, testProjectId);
  });

  const getiModelNameForCreation = (imodelName: string) => {
    return `${imodelsPrefixForTestSuite} ${imodelName}`;
  };

  it("should create an empty iModel", async () => {
    // Arrange
    const imodelName = getiModelNameForCreation("Sample iModel (success)");
    const imodelDescription = "Sample iModel description";
    const imodelExtent: Extent = {
      southWest: { latitude: 1, longitude: 2 },
      northEast: { latitude: 3, longitude: 4 }
    };

    // Act
    const imodel: iModel = await imodelsClient.iModels.createEmpty({
      requestContext: { accessToken: accessToken },
      imodelProperties: {
        projectId: testProjectId,
        name: imodelName,
        description: imodelDescription,
        extent: imodelExtent
      }
    });

    // Assert
    expect(imodel).to.not.be.undefined;
    expect(imodel.name).to.equal(imodelName);
    expect(imodel.description).to.equal(imodelDescription);
    expect(imodel.extent).to.deep.equal(imodelExtent);
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createiModelWithInvalidAccessToken = async () => await imodelsClient.iModels.createEmpty({
      requestContext: { accessToken: "invalidToken" },
      imodelProperties: {
        projectId: testProjectId,
        name: getiModelNameForCreation("Sample iModel (unauthorized)")
      }
    });

    // Act
    let errorThrown: unknown;
    try {
      await createiModelWithInvalidAccessToken();
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    const imodelsError = errorThrown as iModelsError;
    expect(imodelsError).to.not.be.undefined;
    expect(imodelsError.code).to.equal(iModelsErrorCode.Unauthorized);
    expect(imodelsError.details).to.be.undefined;
  });

  it("should return a detailed error when attempting to create iModel with invalid description", async () => {
    // Arrange
    const createiModelWithInvalidDescription = async () => await imodelsClient.iModels.createEmpty({
      requestContext: { accessToken },
      imodelProperties: {
        projectId: testProjectId,
        name: getiModelNameForCreation("Sample iModel (invalid)"),
        description: "x".repeat(256)
      }
    });

    // Act
    let errorThrown: unknown;
    try {
      await createiModelWithInvalidDescription();
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    const imodelsError = errorThrown as iModelsError;
    expect(imodelsError).to.not.be.undefined;
    expect(imodelsError.code).to.equal(iModelsErrorCode.InvalidiModelsRequest);
    expect(imodelsError.message).to.equal("Cannot create iModel.");

    // Assert details
    const invalidDescriptionError = (detail: iModelsErrorDetail) =>
      detail.code === iModelsErrorCode.InvalidValue &&
      detail.message === "Provided 'description' is not valid. The value exceeds allowed 255 characters." &&
      detail.target === "description";
    expect(imodelsError.details).to.not.be.undefined;
    expect(imodelsError.details.length).to.equal(1);
    expect(imodelsError.details.find(invalidDescriptionError)).to.not.be.undefined;
  });
});
