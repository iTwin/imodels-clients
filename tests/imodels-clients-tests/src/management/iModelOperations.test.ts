/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateEmptyiModelParams, iModel, iModelsClient, iModelsErrorCode } from "@itwin/imodels-client-management";
import { assertError, assertiModel } from "../AssertionUtils";
import { cleanUpiModels } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestSuiteContext } from "../TestSuiteContext";

describe("[Management] iModelOperations", () => {
  let testContext: TestSuiteContext;
  let imodelsClient: iModelsClient;

  before(async () => {
    testContext = new TestSuiteContext({
      package: Constants.PackagePrefix,
      testSuite: "[Authoring][iModelOperations]"
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should create an empty iModel", async () => {
    // Arrange
    const imodelCreationParams: CreateEmptyiModelParams = {
      requestContext: testContext.RequestContext,
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Sample iModel (success)"),
        description: "Sample iModel description",
        extent: {
          southWest: { latitude: 1, longitude: 2 },
          northEast: { latitude: 3, longitude: 4 }
        }
      }
    };

    // Act
    const imodel: iModel = await imodelsClient.iModels.createEmpty(imodelCreationParams);

    // Assert
    assertiModel({
      actualiModel: imodel,
      expectediModelProperties: { ...imodelCreationParams.imodelProperties }
    });
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const imodelCreationParams: CreateEmptyiModelParams = {
      requestContext: { authorization: { scheme: "Bearer", token: "invalidToken" } },
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Sample iModel (unauthorized)")
      }
    };

    // Act
    let errorThrown: Error;
    try {
      await imodelsClient.iModels.createEmpty(imodelCreationParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    assertError({
      actualError: errorThrown,
      expectedError: {
        code: iModelsErrorCode.Unauthorized,
        message: ""
      }
    });
  });

  it("should return a detailed error when attempting to create iModel with invalid description", async () => {
    // Arrange
    const imodelCreationParams: CreateEmptyiModelParams = {
      requestContext: testContext.RequestContext,
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Sample iModel (invalid)"),
        description: "x".repeat(256)
      }
    };

    // Act
    let errorThrown: Error;
    try {
      await imodelsClient.iModels.createEmpty(imodelCreationParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    assertError({
      actualError: errorThrown,
      expectedError: {
        code: iModelsErrorCode.InvalidiModelsRequest,
        message: "Cannot create iModel.",
        details: [{
          code: iModelsErrorCode.InvalidValue,
          message: "Provided 'description' is not valid. The value exceeds allowed 255 characters.",
          target: "description"
        }]
      }
    });
  });
});
