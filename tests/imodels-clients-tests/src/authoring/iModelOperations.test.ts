/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateiModelFromBaselineParams, iModel, iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";
import { assertiModel } from "../AssertionUtils";
import { cleanUpiModels } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestAuthenticationProvider } from "../TestAuthenticationProvider";
import { TestClientOptions } from "../TestClientOptions";
import { TestiModelGroup } from "../TestContext";
import { TestiModelMetadata } from "../TestiModelMetadata";
import { TestProjectProvider } from "../TestProjectProvider";

describe("[Authoring] iModelOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringiModelOperations"
      }
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
  });

  it("should create an iModel from baseline", async () => {
    // Arrange
    const createiModelParams: CreateiModelFromBaselineParams = {
      requestContext,
      imodelProperties: {
        projectId,
        name: testiModelGroup.getPrefixediModelName("Sample iModel from baseline")
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
