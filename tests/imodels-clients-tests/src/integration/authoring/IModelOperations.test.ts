/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { randomUUID } from "crypto";

import { AuthorizationCallback, ContainerTypes, CreateIModelFromBaselineParams, IModel, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { TestAuthorizationProvider, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestITwinProvider, TestUtilTypes, assertIModel } from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] IModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let iTwinId: string;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;

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
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "AuthoringIModelOperations" });
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should create an iModel from baseline", async () => {
    // Arrange
    const createIModelParams: CreateIModelFromBaselineParams = {
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel from baseline"),
        filePath: testIModelFileProvider.iModel.filePath,
        containersEnabled: ContainerTypes.None
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.createFromBaseline(createIModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelParams.iModelProperties
    });
  });

  it("should create an iModel from baseline with GCS", async () => {
    // Arrange
    const createIModelParams: CreateIModelFromBaselineParams = {
      authorization,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel from baseline with horizontal CRS"),
        filePath: testIModelFileProvider.iModel.filePath,
        containersEnabled: ContainerTypes.None,
        geographicCoordinateSystem: {
          horizontalCRSId: "EPSG:3857",
        }
      },
      headers: {
        "X-Correlation-Id": randomUUID()
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.iModels.createFromBaseline(createIModelParams);

    // Assert
    await assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelParams.iModelProperties
    });
  });
});
