/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, GetBriefcaseByIdParams, GetBriefcaseListParams, RequestContext, iModel, iModelsClient } from "@itwin/imodels-client-management";
import { Config, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelMetadata, assertBriefcase, assertCollection, findiModelWithName } from "../common";

describe("[Management] BriefcaseOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let defaultiModel: iModel; // todo: test vs default

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();

    defaultiModel = await findiModelWithName({ imodelsClient, requestContext, projectId, expectediModelname: Config.get().testiModelName });
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
        requestContext,
        imodelId: defaultiModel.id,
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
    const briefcaseMetadata = TestiModelMetadata.Briefcase;
    const getBriefcaseByIdParams: GetBriefcaseByIdParams = {
      requestContext,
      imodelId: defaultiModel.id,
      briefcaseId: briefcaseMetadata.id
    };

    // Act
    const briefcase: Briefcase = await imodelsClient.Briefcases.getById(getBriefcaseByIdParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: {
        briefcaseId: briefcaseMetadata.id,
        deviceName: briefcaseMetadata.deviceName
      }
    });
  });
});
