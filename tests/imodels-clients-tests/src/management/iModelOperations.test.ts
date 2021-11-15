/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, CreateEmptyiModelParams, GetiModelListParams, OrderByOperator, iModel, iModelOrderByProperty, iModelsClient, iModelsErrorCode, toArray } from "@itwin/imodels-client-management";
import { Config, Constants, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelCreator, TestiModelGroup, assertCollection, assertError, assertiModel, cleanUpiModels, iModelMetadata } from "../common";

describe("[Management] iModelOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModelMetadata;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementiModelOperations"
      }
    });

    testiModel = await TestiModelCreator.createEmpty({
      imodelsClient: new AuthoringiModelsClient(new TestClientOptions()),
      authorization,
      projectId,
      imodelName: testiModelGroup.getPrefixedUniqueiModelName("Test iModel for collection queries")
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
  });

  it("should create an empty iModel", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      authorization,
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixedUniqueiModelName("Empty Test iModel"),
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
      const imodels = testCase.functionUnderTest(getiModelListParams);

      // Assert
      await assertCollection({
        asyncIterable: imodels,
        isEntityCountCorrect: count => count >= 2
      });
    });
  });

  it("should return items in ascending order when querying representation collection", async () => {
    // Arrange
    const getiModelListParams: GetiModelListParams = {
      authorization,
      urlParams: {
        projectId,
        $orderBy: {
          property: iModelOrderByProperty.Name
        }
      }
    };

    // Act
    const imodels = imodelsClient.iModels.getRepresentationList(getiModelListParams);

    // Assert
    const imodelNames = (await toArray(imodels)).map(imodel => imodel.name);
    for (let i = 0; i < imodelNames.length - 1; i++)
      expect(imodelNames[i] < imodelNames[i + 1]).to.be.true;
  });

  it("should return items in descending order when querying representation collection", async () => {
    // Arrange
    const getiModelListParams: GetiModelListParams = {
      authorization,
      urlParams: {
        projectId,
        $orderBy: {
          property: iModelOrderByProperty.Name,
          operator: OrderByOperator.Descending
        }
      }
    };

    // Act
    const imodels = imodelsClient.iModels.getRepresentationList(getiModelListParams);

    // Assert
    const imodelNames = (await toArray(imodels)).map(imodel => imodel.name);
    for (let i = 0; i < imodelNames.length - 1; i++)
      expect(imodelNames[i] > imodelNames[i + 1]).to.be.true;
  });

  it("should return imodels that match the name filter when querying representation collection", async () => {
    // Arrange
    const getiModelListParams: GetiModelListParams = {
      authorization,
      urlParams: {
        projectId,
        name: testiModel.name
      }
    };

    // Act
    const imodels = imodelsClient.iModels.getRepresentationList(getiModelListParams);

    // Assert
    const imodelArray = await toArray(imodels);
    expect(imodelArray.length).to.equal(1);
    const imodel = imodelArray[0];
    expect(imodel.id).to.equal(imodel.id);
    expect(imodel.name).to.equal(imodel.name);
  });

  it("should not return imodels if none match the name filter when querying representation collection", async () => {
    // Arrange
    const getiModelListParams: GetiModelListParams = {
      authorization,
      urlParams: {
        projectId,
        name: "Non existent name"
      }
    };

    // Act
    const imodels = imodelsClient.iModels.getRepresentationList(getiModelListParams);

    // Assert
    const imodelArray = await toArray(imodels);
    expect(imodelArray.length).to.equal(0);
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createiModelParams: CreateEmptyiModelParams = {
      authorization: () => Promise.resolve({ scheme: "Bearer", token: "invalid token" }),
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixedUniqueiModelName("Sample iModel (unauthorized)")
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
        name: testiModelGroup.getPrefixedUniqueiModelName("Sample iModel (invalid)"),
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
