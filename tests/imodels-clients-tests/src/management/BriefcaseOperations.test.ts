/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, Briefcase, GetBriefcaseByIdParams, GetBriefcaseListParams, iModelsClient } from "@itwin/imodels-client-management";
import { Config, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, assertBriefcase, assertCollection } from "../common";


describe("[Management] BriefcaseOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModel: ReusableiModelMetadata;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModel = await ReusableTestiModelProvider.getOrCreate({
      imodelsClient: new AuthoringiModelsClient(new TestClientOptions()),
      authorization,
      projectId
    });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetBriefcaseListParams) => imodelsClient.Briefcases.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetBriefcaseListParams) => imodelsClient.Briefcases.getRepresentationList(params)
    }
  ].forEach(testCase => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getBriefcaseListParams: GetBriefcaseListParams = {
        authorization,
        imodelId: testiModel.id,
        urlParams: {
          $top: 5
        }
      };

      // Act
      const briefcases = await testCase.functionUnderTest(getBriefcaseListParams);

      // Assert
      assertCollection({
        asyncIterable: briefcases,
        isEntityCountCorrect: count => count === 1
      });
    });
  });

  it("should get briefcase by id", async () => {
    // Arrange
    const getBriefcaseByIdParams: GetBriefcaseByIdParams = {
      authorization,
      imodelId: testiModel.id,
      briefcaseId: testiModel.briefcase.id
    };

    // Act
    const briefcase: Briefcase = await imodelsClient.Briefcases.getById(getBriefcaseByIdParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: {
        briefcaseId: testiModel.briefcase.id,
        deviceName: testiModel.briefcase.deviceName
      }
    });
  });
});
