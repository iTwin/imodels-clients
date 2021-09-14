/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, Briefcase, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { assertBriefcase } from "../AssertionUtils";
import { cleanUpiModels, createEmptyiModel } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestContext } from "../TestContext";

describe("[Authoring] BriefcaseOperations", () => {
  let testContext: TestContext;
  let imodelsClient: iModelsClient;
  let testiModel: iModel;

  before(async () => {
    testContext = new TestContext({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringBriefcaseOperations"
      }
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
    testiModel = await createEmptyiModel({
      imodelsClient,
      testContext,
      imodelName: testContext.getPrefixediModelName("Test iModel for write")
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should acquire briefcase", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      requestContext: testContext.RequestContext,
      imodelId: testiModel.id
    };

    // Act
    const briefcase: Briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: acquireBriefcaseParams.briefcaseProperties
    });
  });
});
