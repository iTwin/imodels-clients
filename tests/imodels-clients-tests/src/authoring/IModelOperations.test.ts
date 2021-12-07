/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, CreateIModelFromBaselineParams, IModel, IModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthorizationProvider, TestClientOptions, TestIModelFileProvider, TestIModelGroup, TestProjectProvider, assertIModel, cleanUpIModels } from "../common";

describe("[Authoring] IModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringIModelOperations"
      }
    });
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  it("should create an iModel from baseline", async () => {
    // Arrange
    const createIModelParams: CreateIModelFromBaselineParams = {
      authorization,
      iModelProperties: {
        projectId,
        name: testIModelGroup.getPrefixedUniqueIModelName("Sample iModel from baseline"),
        filePath: TestIModelFileProvider.iModel.filePath
      }
    };

    // Act
    const iModel: IModel = await iModelsClient.IModels.createFromBaseline(createIModelParams);

    // Assert
    assertIModel({
      actualIModel: iModel,
      expectedIModelProperties: createIModelParams.iModelProperties
    });
  });
});
