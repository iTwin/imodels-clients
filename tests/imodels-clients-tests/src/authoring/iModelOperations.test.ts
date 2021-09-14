/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateiModelFromBaselineParams, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { assertiModel } from "../AssertionUtils";
import { cleanUpiModels } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestContext } from "../TestContext";
import { TestiModelMetadata } from "../TestiModelMetadata";

describe("[Authoring] iModelOperations", () => {
  let testContext: TestContext;
  let imodelsClient: iModelsClient;

  before(async () => {
    testContext = new TestContext({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringiModelOperations"
      }
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should create an iModel from baseline", async () => {
    // Arrange
    const createiModelParams: CreateiModelFromBaselineParams = {
      requestContext: testContext.RequestContext,
      imodelProperties: {
        projectId: testContext.ProjectId,
        name: testContext.getPrefixediModelName("Sample iModel from baseline")
      },
      baselineFileProperties: {
        path: TestiModelMetadata.iModel.baselineFilePath
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
