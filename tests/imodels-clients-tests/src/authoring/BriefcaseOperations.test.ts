/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, AuthorizationCallback, Briefcase, iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelCreator, TestiModelGroup, assertBriefcase, cleanUpiModels, iModelMetadata } from "../common";

describe("[Authoring] BriefcaseOperations", () => {
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
        testSuite: "AuthoringBriefcaseOperations"
      }
    });

    testiModel = await TestiModelCreator.createEmpty({
      imodelsClient,
      authorization,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
  });

  it("should acquire briefcase", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      imodelId: testiModel.id,
      briefcaseProperties: {
        deviceName: "some device name"
      }
    };

    // Act
    const briefcase: Briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: acquireBriefcaseParams.briefcaseProperties!
    });
  });
});
