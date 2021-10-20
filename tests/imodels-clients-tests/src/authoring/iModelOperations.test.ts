/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateiModelFromBaselineParams, AuthorizationCallback, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelFileProvider, TestiModelGroup, assertiModel, cleanUpiModels } from "../common";

describe("[Authoring] iModelOperations", () => {
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
        testSuite: "AuthoringiModelOperations"
      }
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
  });

  it("should create an iModel from baseline", async () => {
    // Arrange
    const createiModelParams: CreateiModelFromBaselineParams = {
      authorization,
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixediModelName("Sample iModel from baseline")
      },
      baselineFileProperties: {
        path: TestiModelFileProvider.imodel.filePath
      }
    };

    // Act
    const imodel: iModel = await imodelsClient.iModels.createFromBaseline(createiModelParams);

    // Assert
    assertiModel({
      actualiModel: imodel,
      expectediModelProperties: createiModelParams.imodelProperties
    });
  });
});
