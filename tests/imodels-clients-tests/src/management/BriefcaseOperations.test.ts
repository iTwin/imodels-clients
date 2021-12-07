/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { IModelsClient as AuthoringIModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, Briefcase, GetBriefcaseListParams, GetSingleBriefcaseParams, IModelsClient, SPECIAL_VALUES_ME, toArray } from "@itwin/imodels-client-management";
import { Config, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, assertBriefcase, assertCollection } from "../common";

describe("[Management] BriefcaseOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModel: ReusableIModelMetadata;

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModel = await ReusableTestIModelProvider.getOrCreate({
      iModelsClient: new AuthoringIModelsClient(new TestClientOptions()),
      authorization,
      projectId
    });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetBriefcaseListParams) => iModelsClient.briefcases.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetBriefcaseListParams) => iModelsClient.briefcases.getRepresentationList(params)
    }
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getBriefcaseListParams: GetBriefcaseListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          $top: 5
        }
      };

      // Act
      const briefcases = testCase.functionUnderTest(getBriefcaseListParams);

      // Assert
      await assertCollection({
        asyncIterable: briefcases,
        isEntityCountCorrect: (count) => count === 1
      });
    });
  });

  it("should return user owned briefcases when querying representation collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    // Act
    const briefcases = iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.equal(1);
    const briefcase = briefcasesArray[0];
    expect(briefcase.briefcaseId).to.equal(testIModel.briefcase.id);
  });

  it("should not return user owned briefcases if user does not own any when querying representation collection", async () => {
    // Arrange
    const authorizationForUser2 = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin2FullyFeatured);
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization: authorizationForUser2,
      iModelId: testIModel.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME
      }
    };

    // Act
    const briefcases = iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.equal(0);
  });

  it("should get briefcase by id", async () => {
    // Arrange
    const getSingleBriefcaseParams: GetSingleBriefcaseParams = {
      authorization,
      iModelId: testIModel.id,
      briefcaseId: testIModel.briefcase.id
    };

    // Act
    const briefcase: Briefcase = await iModelsClient.briefcases.getSingle(getSingleBriefcaseParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: {
        briefcaseId: testIModel.briefcase.id,
        deviceName: testIModel.briefcase.deviceName
      }
    });
  });
});
