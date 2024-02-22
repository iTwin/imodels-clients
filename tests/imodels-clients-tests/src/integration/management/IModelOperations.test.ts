/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { randomUUID } from "crypto";

import { expect } from "chai";

import { AuthorizationCallback, CreateEmptyIModelParams, CreateIModelFromTemplateParams, EntityListIterator, Extent, GetIModelListParams, GetSingleIModelParams, IModel, IModelOrderByProperty, IModelsClient, IModelsClientOptions, IModelsErrorCode, MinimalIModel, OrderByOperator, UpdateIModelParams, take, toArray } from "@itwin/imodels-client-management";
import { IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestITwinProvider, TestUtilTypes, assertCollection, assertError, assertIModel, assertMinimalIModel } from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] IModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let iTwinId: string;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForUpdate: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testITwinProvider = container.get(TestITwinProvider);
    iTwinId = await testITwinProvider.getOrCreate();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "ManagementIModelOperations" });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForUpdate = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for update"));
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
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
          iTwinId,
          $top: 5
        },
        headers: {
          "X-Correlation-Id": randomUUID()
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
      iModelId: testIModelForRead.id,
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.getSingle(getSingleiModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: {
        iTwinId,
        name: testIModelForRead.name,
        description: testIModelForRead.description
      }
    });
  });

  it("should return items in ascending/descending order when querying representation collection", async () => {
    // Arrange
    const correlationId = randomUUID();
    await iModelsClient.iModels.createEmpty({
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getFirstIModelNameForOrderingTests()
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    });
    await iModelsClient.iModels.createEmpty({
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getLastIModelNameForOrderingTests()
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    });

    const getAscendingIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        $orderBy: {
          property: IModelOrderByProperty.Name
        }
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    };
    const getDescendingIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        $orderBy: {
          property: IModelOrderByProperty.Name,
          operator: OrderByOperator.Descending
        }
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    };

    // Act
    const ascendingIModelArray = await toArray(iModelsClient.iModels.getRepresentationList(getAscendingIModelListParams));
    const descendingIModelArray = await toArray(iModelsClient.iModels.getRepresentationList(getDescendingIModelListParams));

    // Assert
    expect(ascendingIModelArray.length).to.be.greaterThanOrEqual(2);
    const {
      firstIModelIndex: firstIModelIndexInAscArray,
      lastIModelIndex: lastIModelIndexInAscArray
    } = assertAscendingiModelArray(ascendingIModelArray);
    expect(lastIModelIndexInAscArray).to.be.greaterThan(firstIModelIndexInAscArray);

    expect(descendingIModelArray.length).to.be.greaterThanOrEqual(2);
    const {
      firstIModelIndex: firstIModelIndexInDescArray,
      lastIModelIndex: lastIModelIndexInDescArray
    } = assertAscendingiModelArray(descendingIModelArray);
    expect(firstIModelIndexInDescArray).to.be.greaterThan(lastIModelIndexInDescArray);
  });

  function assertAscendingiModelArray(iModelArray: IModel[]): { firstIModelIndex: number, lastIModelIndex: number } {
    const firstIModelIndex = iModelArray.findIndex((iModel) => iModel.name.startsWith(testIModelGroup.firstNamePrefix));
    expect(firstIModelIndex).to.not.be.equal(-1);
    const lastIModelIndex = iModelArray.findIndex((iModel) => iModel.name.startsWith(testIModelGroup.lastNamePrefix));
    expect(lastIModelIndex).to.not.be.equal(-1);
    return { firstIModelIndex, lastIModelIndex };
  }

  it("should return iModels that match the name filter when querying representation collection", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        name: testIModelForRead.name
      },
      headers: {
        "X-Correlation-Id": randomUUID()
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

  it("should get minimal iModel", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        $top: 1
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const minimalIModels: EntityListIterator<MinimalIModel> = iModelsClient.iModels.getMinimalList(getIModelListParams);

    // Assert
    const minimalIModelList = await take(minimalIModels, 1);
    expect(minimalIModelList.length).to.be.equal(1);
    const minimalIModel = minimalIModelList[0];
    assertMinimalIModel({
      actualIModel: minimalIModel
    });
  });

  it("should not return iModels if none match the name filter when querying representation collection", async () => {
    // Arrange
    const getIModelListParams: GetIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        name: "Non existent name"
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModels = iModelsClient.iModels.getRepresentationList(getIModelListParams);

    // Assert
    const iModelArray = await toArray(iModels);
    expect(iModelArray.length).to.equal(0);
  });

  it("should create an empty IModel", async () => {
    // Arrange
    const createIModelParams: CreateEmptyIModelParams = {
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Empty Test IModel"),
        description: "Sample iModel description",
        extent: {
          southWest: { latitude: 1, longitude: 2 },
          northEast: { latitude: 3, longitude: 4 }
        }
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.createEmpty(createIModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelParams.iModelProperties
    });
  });

  it("should create iModel from template (without changeset id specified)", async () => {
    // Arrange
    const createIModelFromTemplateParams: CreateIModelFromTemplateParams = {
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("iModel from template (without changeset)"),
        template: {
          iModelId: testIModelForRead.id
        }
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.createFromTemplate(createIModelFromTemplateParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelFromTemplateParams.iModelProperties
    });
  });

  it("should create iModel from template (with changeset id specified)", async () => {
    // Arrange
    const createIModelFromTemplateParams: CreateIModelFromTemplateParams = {
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("iModel from template (with changeset)"),
        template: {
          iModelId: testIModelForRead.id,
          changesetId: testIModelFileProvider.changesets[5].id
        }
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.createFromTemplate(createIModelFromTemplateParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelFromTemplateParams.iModelProperties
    });
  });

  it("should update iModel name", async () => {
    // Arrange
    const correlationId = randomUUID();
    const iModelBeforeUpdate: IModel = await iModelsClient.iModels.getSingle({
      authorization,
      iModelId: testIModelForUpdate.id,
      headers: {
        "X-Correlation-Id": correlationId
      }
    });

    const newIModelName = testIModelGroup.getPrefixedUniqueIModelName("new iModel name");
    const updateIModelParams: UpdateIModelParams = {
      authorization,
      iModelId: testIModelForUpdate.id,
      iModelProperties: {
        name: newIModelName
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.update(updateIModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: {
        name: newIModelName,
        iTwinId: iModelBeforeUpdate.iTwinId,
        description: iModelBeforeUpdate.description!,
        extent: iModelBeforeUpdate.extent!
      }
    });
  });

  it("should update iModel description", async () => {
    // Arrange
    const correlationId = randomUUID();
    const iModelBeforeUpdate: IModel = await iModelsClient.iModels.getSingle({
      authorization,
      iModelId: testIModelForUpdate.id,
      headers: {
        "X-Correlation-Id": correlationId
      }
    });

    const newIModelDescription = "new description";
    const updateIModelParams: UpdateIModelParams = {
      authorization,
      iModelId: testIModelForUpdate.id,
      iModelProperties: {
        description: newIModelDescription
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.update(updateIModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: {
        name: iModelBeforeUpdate.name,
        iTwinId: iModelBeforeUpdate.iTwinId,
        description: newIModelDescription,
        extent: iModelBeforeUpdate.extent!
      }
    });
  });

  it("should update iModel extent", async () => {
    // Arrange
    const correlationId = randomUUID();
    const iModelBeforeUpdate: IModel = await iModelsClient.iModels.getSingle({
      authorization,
      iModelId: testIModelForUpdate.id,
      headers: {
        "X-Correlation-Id": correlationId
      }
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
      },
      headers: {
        "X-Correlation-Id": correlationId
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.update(updateIModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: {
        name: iModelBeforeUpdate.name,
        iTwinId: iModelBeforeUpdate.iTwinId,
        description: iModelBeforeUpdate.description!,
        extent: newIModelExtent
      }
    });
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createIModelParams: CreateEmptyIModelParams = {
      authorization: async () => ({ scheme: "Bearer", token: "invalid token" }),
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel (unauthorized)")
      },
      headers: {
        "X-Correlation-Id": randomUUID()
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
        message: "Access denied due to invalid access_token. Make sure that issuer is correct, the token is not expired and is not corrupted."
      }
    });
  });

  it("should return a detailed error when attempting to create iModel with invalid description", async () => {
    // Arrange
    const createIModelParams: CreateEmptyIModelParams = {
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel (invalid)"),
        description: "x".repeat(256)
      },
      headers: {
        "X-Correlation-Id": randomUUID()
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
        message: "Cannot create iModel. Details:\n1. InvalidValue: Provided 'description' value is not valid. The value exceeds allowed 255 characters. Target: description.\n",
        details: [{
          code: IModelsErrorCode.InvalidValue,
          message: "Provided 'description' value is not valid. The value exceeds allowed 255 characters.",
          target: "description"
        }]
      }
    });
  });
});

