/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, Briefcase, GetBriefcaseByIdParams, GetBriefcaseListParams, SPECIAL_VALUES_ME, iModelsClient, toArray } from "@itwin/imodels-client-management";
import { Config, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, assertBriefcase, assertCollection } from "../common";

describe("[Management] BriefcaseOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModel: ReusableiModelMetadata;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
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
      const briefcases = testCase.functionUnderTest(getBriefcaseListParams);

      // Assert
      await assertCollection({
        asyncIterable: briefcases,
        isEntityCountCorrect: count => count === 1
      });
    });
  });

  it("should return user owned briefcases when querying representation collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      imodelId: testiModel.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    // Act
    const briefcases = imodelsClient.Briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.equal(1);
    const briefcase = briefcasesArray[0];
    expect(briefcase.briefcaseId).to.equal(testiModel.briefcase.id);
  });

  it("should not return user owned briefcases if user does not own any when querying representation collection", async () => {
    // Arrange
    const authorizationForUser2 = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin2FullyFeatured);
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization: authorizationForUser2,
      imodelId: testiModel.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    // Act
    const briefcases = imodelsClient.Briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.equal(0);
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
