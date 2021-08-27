/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, iModelsClient, iModelsErrorCode, RequestContext } from "@itwin/imodels-client-management";
import { assertError, assertiModel } from "../AssertionUtils";
import { cleanUpiModelsWithPrefix, generateiModelNameWithPrefixes, getAuthorizedRequestContext, getTestiModelsClientConfig, getTestProjectId } from "../CommonTestUtils";
import { Constants } from "../Constants";

describe("[Management] iModelsClient", () => {
  let requestContext: RequestContext;
  let projectId: string;
  let imodelsClient: iModelsClient;

  const imodelsPrefixForTestSuite = "[Management][iModelOperations]";

  before(async () => {
    requestContext = getAuthorizedRequestContext();
    projectId = getTestProjectId();
    imodelsClient = new iModelsClient(getTestiModelsClientConfig());
  });

  after(async () => {
    return cleanUpiModelsWithPrefix({
      imodelsClient,
      requestContext,
      projectId,
      prefixes: {
        package: Constants.PackagePrefix,
        testSuite: imodelsPrefixForTestSuite
      }
    });
  });

  function getiModelName(name: string): string {
    return generateiModelNameWithPrefixes({
      imodelName: name,
      prefixes: {
        package: Constants.PackagePrefix,
        testSuite: imodelsPrefixForTestSuite
      }
    });
  }

  it("should create an empty iModel", async () => {
    // Arrange
    const imodelCreationParams = {
      requestContext,
      imodelProperties: {
        projectId: projectId,
        name: getiModelName("Sample iModel (success)"),
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
    const imodelCreationParams = {
      requestContext: { authorization: { scheme: "Bearer", token: "invalidToken" } },
      imodelProperties: {
        projectId: projectId,
        name: getiModelName("Sample iModel (unauthorized)")
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
    const imodelCreationParams = {
      requestContext,
      imodelProperties: {
        projectId: projectId,
        name: getiModelName("Sample iModel (invalid)"),
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
