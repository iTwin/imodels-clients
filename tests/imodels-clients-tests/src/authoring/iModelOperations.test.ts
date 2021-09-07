/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateiModelFromBaselineParams, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { assertiModel } from "../AssertionUtils";
import { cleanUpiModels } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestiModelDataReader } from "../TestiModelDataReader";
import { TestSuiteContext } from "../TestSuiteContext";

describe("[Authoring] iModelOperations", () => {
  let testContext: TestSuiteContext;
  let imodelsClient: iModelsClient;
  let testiModelDataReader: TestiModelDataReader;

  before(async () => {
    testContext = new TestSuiteContext({
      package: Constants.PackagePrefix,
      testSuite: "[Authoring][iModelOperations]"
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
    testiModelDataReader = new TestiModelDataReader();
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should create an iModel from baseline", async () => {
    // Arrange
    const imodelCreationParams: CreateiModelFromBaselineParams = {
      requestContext: testContext.RequestContext,
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Sample iModel from baseline")
      },
      baselineFileProperties: {
        path: testiModelDataReader.iModel.baselineFilePath
      }
    };

    // Act
    const imodel: iModel = await imodelsClient.iModels.createFromBaseline(imodelCreationParams);

    // Assert
    assertiModel({
      actualiModel: imodel,
      expectediModelProperties: { ...imodelCreationParams.imodelProperties }
    });
  });
});
