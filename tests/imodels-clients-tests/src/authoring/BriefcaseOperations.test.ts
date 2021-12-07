/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, AuthorizationCallback, Briefcase, IModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, IModelMetadata, TestAuthorizationProvider, TestClientOptions, TestIModelCreator, TestIModelGroup, TestProjectProvider, assertBriefcase, cleanUpIModels } from "../common";

describe("[Authoring] BriefcaseOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;
  let testIModel: IModelMetadata;

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringBriefcaseOperations"
      }
    });

    testIModel = await TestIModelCreator.createEmpty({
      iModelsClient,
      authorization,
      projectId,
      iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    });
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  it("should acquire briefcase", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iModelId: testIModel.id,
      briefcaseProperties: {
        deviceName: "some device name"
      }
    };

    // Act
    const briefcase: Briefcase = await iModelsClient.Briefcases.acquire(acquireBriefcaseParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: acquireBriefcaseParams.briefcaseProperties!
    });
  });
});
