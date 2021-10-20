/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, CreateEmptyiModelParams, GetiModelListParams, iModel, iModelsClient, iModelsErrorCode } from "@itwin/imodels-client-management";
import { Config, Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, assertCollection, assertError, assertiModel } from "../common";

describe("[Management] iModelOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementiModelOperations"
      }
    });
  });

  it("should create an empty iModel", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      authorization,
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixediModelName("Empty Test iModel"),
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
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getiModelListParams: GetiModelListParams = {
        authorization,
        urlParams: {
          projectId,
          $top: 5
        }
      };

      // Act
      const imodels = await testCase.functionUnderTest(getiModelListParams);

      // Assert
      assertCollection({
        asyncIterable: imodels,
        isEntityCountCorrect: count => count > 0
      });
    });
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      authorization: () => Promise.resolve({ scheme: "Bearer", token: "invalid token" }),
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixediModelName("Sample iModel (unauthorized)")
      }
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.iModels.createEmpty(createiModelParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.Unauthorized,
        message: "The user is unauthorized. Please provide valid authentication credentials."
      }
    });
  });

  it("should return a detailed error when attempting to create iModel with invalid description", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      authorization,
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixediModelName("Sample iModel (invalid)"),
        description: "x".repeat(256)
      }
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.iModels.createEmpty(createiModelParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
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
