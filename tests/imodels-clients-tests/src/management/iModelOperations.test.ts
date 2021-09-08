/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateEmptyiModelParams, GetiModelListParams, iModel, iModelsClient, iModelsErrorCode } from "@itwin/imodels-client-management";
import { assertError, assertiModel } from "../AssertionUtils";
import { assertCollection, cleanUpiModels } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestContext } from "../TestContext";

describe("[Management] iModelOperations", () => {
  let testContext: TestContext;
  let imodelsClient: iModelsClient;

  before(async () => {
    testContext = new TestContext({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementiModelOperations"
      }
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should create an empty iModel", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      requestContext: testContext.RequestContext,
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Empty Test iModel"),
        description: "Sample iModel description",
        extent: {
          southWest: { latitude: 1, longitude: 2 },
          northEast: { latitude: 3, longitude: 4 }
        }
      }
    };

    // Act
    const imodel: iModel = await imodelsClient.iModels.createEmpty(createiModelParams);

    // Assert
    assertiModel({
      actualiModel: imodel,
      expectediModelProperties: createiModelParams.imodelProperties
    });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetiModelListParams) => imodelsClient.iModels.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetiModelListParams) => imodelsClient.iModels.getRepresentationList(params)
    }
  ].forEach(testCase => {
    it(`should get ${testCase.label} collection`, async () => {
      // Arrange
      const getiModelListParams: GetiModelListParams = {
        requestContext: testContext.RequestContext,
        urlParams: {
          projectId: testContext.ProjectId,
          $top: 5
        }
      };

      // Act
      const imodels = await testCase.functionUnderTest(getiModelListParams);

      // Assert
      assertCollection({
        asyncIterable: imodels,
        expectedEntityCount: 1
      });
    });
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      requestContext: { authorization: { scheme: "Bearer", token: "invalidToken" } },
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Sample iModel (unauthorized)")
      }
    };

    // Act
    let errorThrown: Error;
    try {
      await imodelsClient.iModels.createEmpty(createiModelParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    assertError({
      actualError: errorThrown,
      expectedError: {
        code: iModelsErrorCode.Unauthorized,
        message: "The user is unauthorized. Please provide valid authentication credentials."
      }
    });
  });

  it("should return a detailed error when attempting to create iModel with invalid description", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
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
      await imodelsClient.iModels.createEmpty(createiModelParams);
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
