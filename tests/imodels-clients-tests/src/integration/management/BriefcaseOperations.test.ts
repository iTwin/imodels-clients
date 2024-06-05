/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { AuthorizationCallback, Briefcase, BriefcaseOrderByProperty, EntityListIterator, GetBriefcaseListParams, GetSingleBriefcaseParams, IModelsClient, IModelsClientOptions, OrderByOperator, SPECIAL_VALUES_ME, take, toArray } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes, assertBriefcase, assertCollection, assertMinimalBriefcase } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] BriefcaseOperations", () => {
  let iModelsClient: IModelsClient;
  let authorizationProvider: TestAuthorizationProvider;
  let authorization: AuthorizationCallback;

  let testIModel: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModel = await reusableTestIModelProvider.getOrCreate();
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
        isEntityCountCorrect: (count) => count === testIModel.briefcases.length
      });
    });
  });

  it("should return user owned briefcases when querying representation collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME,
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime
        }
      }
    };

    // Act
    const briefcases = iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcaseList = await toArray(briefcases);
    expect(briefcaseList.length).to.equal(testIModel.briefcases.length);
    for (let i = 0; i < briefcaseList.length; i++) {
      assertBriefcase({
        actualBriefcase: briefcaseList[i],
        expectedBriefcaseProperties: {
          briefcaseId: testIModel.briefcases[i].id,
          deviceName: testIModel.briefcases[i].deviceName
        }
      });
    }
  });

  it("should not return user owned briefcases if user does not own any when querying representation collection", async () => {
    // Arrange
    const authorizationForUser2 = authorizationProvider.getFullyFeaturedAdmin2Authorization();
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

  it("should get valid minimal briefcase when querying minimal collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        $top: 1
      }
    };

    // Act
    const minimalBriefcases = iModelsClient.briefcases.getMinimalList(getBriefcaseListParams);

    // Assert
    const minimalBriefcaseList = await take(minimalBriefcases, 1);
    expect(minimalBriefcaseList.length).to.be.equal(1);
    const minimalBriefcase = minimalBriefcaseList[0];
    assertMinimalBriefcase({
      actualBriefcase: minimalBriefcase
    });
  });

  it("should get valid full named version when querying representation collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        $top: 1,
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime
        }
      }
    };

    // Act
    const briefcases: EntityListIterator<Briefcase> =
      iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcaseList: Briefcase[] = await take(briefcases, 1);
    expect(briefcaseList.length).to.be.equal(1);
    const briefcase = briefcaseList[0];
    await assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: {
        briefcaseId: testIModel.briefcases[0].id,
        deviceName: testIModel.briefcases[0].deviceName
      }
    });
  });

  it("should get briefcase by id", async () => {
    // Arrange
    const expectedBriefcase = testIModel.briefcases[0];
    const getSingleBriefcaseParams: GetSingleBriefcaseParams = {
      authorization,
      iModelId: testIModel.id,
      briefcaseId: expectedBriefcase.id
    };

    // Act
    const briefcase: Briefcase = await iModelsClient.briefcases.getSingle(getSingleBriefcaseParams);

    // Assert
    await assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: {
        briefcaseId: expectedBriefcase.id,
        deviceName: expectedBriefcase.deviceName
      }
    });
  });

  it("should order items by acquiredDateTime when querying representation collection (ascending order)", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime
        }
      }
    };

    // Act
    const briefcases = await toArray(iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams));

    // Assert
    expect(briefcases.length).to.equal(testIModel.briefcases.length);
    for (let i = 0; i < briefcases.length - 1; i++)
      expect(new Date(briefcases[i].acquiredDateTime)).to.be.lessThan(new Date(briefcases[i + 1].acquiredDateTime));
  });

  it("should order items by acquiredDateTime when querying representation collection (descending order)", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime,
          operator: OrderByOperator.Descending
        }
      }
    };

    // Act
    const briefcases = await toArray(iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams));

    // Assert
    expect(briefcases.length).to.equal(testIModel.briefcases.length);
    for (let i = 0; i < briefcases.length - 1; i++)
      expect(new Date(briefcases[i].acquiredDateTime)).to.be.greaterThan(new Date(briefcases[i + 1].acquiredDateTime));
  });
});
