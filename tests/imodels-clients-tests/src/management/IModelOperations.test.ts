/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { IModelsClient as AuthoringIModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, CreateEmptyIModelParams, GetIModelListParams, IModel, IModelOrderByProperty, IModelsClient, IModelsErrorCode, OrderByOperator, toArray } from "@itwin/imodels-client-management";
import { Config, Constants, IModelMetadata, TestAuthorizationProvider, TestClientOptions, TestIModelCreator, TestIModelGroup, TestProjectProvider, assertCollection, assertError, assertIModel, cleanUpIModels } from "../common";

describe("[Management] IModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;
  let testIModel: IModelMetadata;

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementIModelOperations"
      }
    });

    testIModel = await TestIModelCreator.createEmpty({
      iModelsClient: new AuthoringIModelsClient(new TestClientOptions()),
      authorization,
      projectId,
      iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test iModel for collection queries")
    });
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  it("should create an empty IModel", async () => {
    // Arrange
    const createIModelParams: CreateEmptyIModelParams = {
      authorization,
      iModelProperties: {
        projectId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Empty Test IModel"),
        description: "Sample iModel description",
        extent: {
          southWest: { latitude: 1, longitude: 2 },
          northEast: { latitude: 3, longitude: 4 }
        }
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.IModels.createEmpty(createIModelParams);

    // Assert
    assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelParams.iModelProperties
    });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetIModelListParams) => iModelsClient.IModels.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetIModelListParams) => iModelsClient.IModels.getRepresentationList(params)
    }
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getIModelListParams: GetIModelListParams = {
        authorization,
        urlParams: {
          projectId,
          $top: 5
        }
      };

      // Act
      const iModels = testCase.functionUnderTest(getIModelListParams);

      // Assert
      await assertCollection({
        asyncIterable: iModels,
        isEntityCountCorrect: (count) => count >= 2
      });
    });
  });

  it("should return items in ascending order when querying representation collection", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        projectId,
        $orderBy: {
          property: IModelOrderByProperty.Name
        }
      }
    };

    // Act
    const iModels = iModelsClient.IModels.getRepresentationList(getIModelListParams);

    // Assert
    const iModelNames = (await toArray(iModels)).map((iModel) => iModel.name);
    for (let i = 0; i < iModelNames.length - 1; i++)
      expect(iModelNames[i] < iModelNames[i + 1]).to.be.true;
  });

  it("should return items in descending order when querying representation collection", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        projectId,
        $orderBy: {
          property: IModelOrderByProperty.Name,
          operator: OrderByOperator.Descending
        }
      }
    };

    // Act
    const iModels = iModelsClient.IModels.getRepresentationList(getIModelListParams);

    // Assert
    const iModelNames = (await toArray(iModels)).map((iModel) => iModel.name);
    for (let i = 0; i < iModelNames.length - 1; i++)
      expect(iModelNames[i] > iModelNames[i + 1]).to.be.true;
  });

  it("should return iModels that match the name filter when querying representation collection", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        projectId,
        name: testIModel.name
      }
    };

    // Act
    const iModels = iModelsClient.IModels.getRepresentationList(getIModelListParams);

    // Assert
    const iModelArray = await toArray(iModels);
    expect(iModelArray.length).to.equal(1);
    const iModel = iModelArray[0];
    expect(iModel.id).to.equal(iModel.id);
    expect(iModel.name).to.equal(iModel.name);
  });

  it("should not return iModels if none match the name filter when querying representation collection", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        projectId,
        name: "Non existent name"
      }
    };

    // Act
    const iModels = iModelsClient.IModels.getRepresentationList(getIModelListParams);

    // Assert
    const iModelArray = await toArray(iModels);
    expect(iModelArray.length).to.equal(0);
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createIModelParams: CreateEmptyIModelParams = {
      authorization: async () => ({ scheme: "Bearer", token: "invalid token" }),
      iModelProperties: {
        projectId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel (unauthorized)")
      }
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.IModels.createEmpty(createIModelParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.Unauthorized,
        message: "The user is unauthorized. Please provide valid authentication credentials."
      }
    });
  });

  it("should return a detailed error when attempting to create iModel with invalid description", async () => {
    // Arrange
    const createIModelParams: CreateEmptyIModelParams = {
      authorization,
      iModelProperties: {
        projectId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel (invalid)"),
        description: "x".repeat(256)
      }
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.IModels.createEmpty(createIModelParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.InvalidIModelsRequest,
        message: "Cannot create IModel. Details:\n1. InvalidValue: Provided 'description' is not valid. The value exceeds allowed 255 characters. Target: description.\n",
        details: [{
          code: IModelsErrorCode.InvalidValue,
          message: "Provided 'description' is not valid. The value exceeds allowed 255 characters.",
          target: "description"
        }]
      }
    });
  });
});
