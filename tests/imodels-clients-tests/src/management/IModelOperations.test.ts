/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, CreateEmptyIModelParams, Extent, GetIModelListParams, GetSingleIModelParams, IModel, IModelOrderByProperty, IModelsClient, IModelsClientOptions, IModelsErrorCode, OrderByOperator, UpdateIModelParams, toArray } from "@itwin/imodels-client-management";
import { IModelMetadata, TestAuthorizationProvider, TestIModelCreator, TestIModelGroup, TestIModelGroupFactory, TestProjectProvider, TestUtilTypes, assertCollection, assertError, assertIModel } from "@itwin/imodels-client-test-utils";
import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] IModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;

  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: IModelMetadata;
  let testIModelForUpdate: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testProjectProvider = container.get(TestProjectProvider);
    projectId = await testProjectProvider.getOrCreate();

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "ManagementIModelOperations" });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForRead = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for collection queries"));
    testIModelForUpdate = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for update"));
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
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
    const iModel: IModel = await iModelsClient.iModels.createEmpty(createIModelParams);

    // Assert
    assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelParams.iModelProperties
    });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetIModelListParams) => iModelsClient.iModels.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetIModelListParams) => iModelsClient.iModels.getRepresentationList(params)
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

  it("should return an iModel by id", async () => {
    // Arrange
    const getSingleiModelParams: GetSingleIModelParams = {
      authorization,
      iModelId: testIModelForRead.id
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.getSingle(getSingleiModelParams);

    // Assert
    assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: {
        projectId,
        name: testIModelForRead.name,
        description: testIModelForRead.description
      }
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
    const iModels = iModelsClient.iModels.getRepresentationList(getIModelListParams);

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
    const iModels = iModelsClient.iModels.getRepresentationList(getIModelListParams);

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
        name: testIModelForRead.name
      }
    };

    // Act
    const iModels = iModelsClient.iModels.getRepresentationList(getIModelListParams);

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
    const iModels = iModelsClient.iModels.getRepresentationList(getIModelListParams);

    // Assert
    const iModelArray = await toArray(iModels);
    expect(iModelArray.length).to.equal(0);
  });

  it("should update iModel name", async () => {
    // Arrange
    const iModelBeforeUpdate: IModel = await iModelsClient.iModels.getSingle({
      authorization,
      iModelId: testIModelForUpdate.id
    });

    const newIModelName = testIModelGroup.getPrefixedUniqueIModelName("new iModel name");
    const updateIModelParams: UpdateIModelParams = {
      authorization,
      iModelId: testIModelForUpdate.id,
      iModelProperties: {
        name: newIModelName
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.update(updateIModelParams);

    // Assert
    expect(iModel.name).to.be.equal(newIModelName);
    expect(iModel.description).to.be.equal(iModelBeforeUpdate.description);
    expect(iModel.extent).to.be.deep.equal(iModelBeforeUpdate.extent);
  });

  it("should update iModel description", async () => {
    // Arrange
    const iModelBeforeUpdate: IModel = await iModelsClient.iModels.getSingle({
      authorization,
      iModelId: testIModelForUpdate.id
    });

    const newIModelDescription = "new description";
    const updateIModelParams: UpdateIModelParams = {
      authorization,
      iModelId: testIModelForUpdate.id,
      iModelProperties: {
        description: newIModelDescription
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.update(updateIModelParams);

    // Assert
    expect(iModel.name).to.be.equal(iModelBeforeUpdate.name);
    expect(iModel.description).to.be.equal(newIModelDescription);
    expect(iModel.extent).to.be.deep.equal(iModelBeforeUpdate.extent);
  });

  it("should update iModel extent", async () => {
    // Arrange
    const iModelBeforeUpdate: IModel = await iModelsClient.iModels.getSingle({
      authorization,
      iModelId: testIModelForUpdate.id
    });

    const newIModelExtent: Extent = {
      southWest: {
        latitude: 80,
        longitude: 170
      },
      northEast: {
        latitude: -80,
        longitude: -170
      }
    };
    const updateIModelParams: UpdateIModelParams = {
      authorization,
      iModelId: testIModelForUpdate.id,
      iModelProperties: {
        extent: newIModelExtent
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.update(updateIModelParams);

    // Assert
    expect(iModel.name).to.be.equal(iModelBeforeUpdate.name);
    expect(iModel.description).to.be.equal(iModelBeforeUpdate.description);
    expect(iModel.extent).to.be.deep.equal(newIModelExtent);
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
    let objectThrown: unknown;
    try {
      await iModelsClient.iModels.createEmpty(createIModelParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
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
    let objectThrown: unknown;
    try {
      await iModelsClient.iModels.createEmpty(createIModelParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.InvalidIModelsRequest,
        message: "Cannot create iModel. Details:\n1. InvalidValue: Provided 'description' is not valid. The value exceeds allowed 255 characters. Target: description.\n",
        details: [{
          code: IModelsErrorCode.InvalidValue,
          message: "Provided 'description' is not valid. The value exceeds allowed 255 characters.",
          target: "description"
        }]
      }
    });
  });
});
