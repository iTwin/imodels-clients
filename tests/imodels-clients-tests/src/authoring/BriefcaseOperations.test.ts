/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, AuthorizationCallback, Briefcase, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { IModelMetadata, TestAuthorizationProvider, TestIModelCreator, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, assertBriefcase } from "@itwin/imodels-client-test-utils";
import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] BriefcaseOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelGroup: TestIModelGroup;
  let testIModel: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "AuthoringBriefcaseOperations" });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModel = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
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
    const briefcase: Briefcase = await iModelsClient.briefcases.acquire(acquireBriefcaseParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: acquireBriefcaseParams.briefcaseProperties!
    });
  });
});
