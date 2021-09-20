/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, Briefcase, iModel, iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";
import { assertBriefcase } from "../AssertionUtils";
import { cleanUpiModels, createEmptyiModel } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestAuthenticationProvider } from "../TestAuthenticationProvider";
import { TestClientOptions } from "../TestClientOptions";
import { TestiModelGroup } from "../TestContext";
import { TestiModelMetadata } from "../TestiModelMetadata";
import { TestProjectProvider } from "../TestProjectProvider";

describe("[Authoring] BriefcaseOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModel;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringBriefcaseOperations"
      }
    });

    testiModel = await createEmptyiModel({
      imodelsClient,
      requestContext,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
  });

  it("should acquire briefcase", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      requestContext,
      imodelId: testiModel.id,
      briefcaseProperties: {
        deviceName: TestiModelMetadata.Briefcase.deviceName
      }
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
