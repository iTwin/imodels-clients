/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { GetBriefcaseListParams, GetBriefcaseByIdParams, iModel, iModelsClient, Briefcase } from "@itwin/imodels-client-management";
import { assertBriefcase, assertCollection } from "../AssertionUtils";
import { cleanUpiModels, findiModelWithName } from "../CommonTestUtils";
import { Config } from "../Config";
import { Constants } from "../Constants";
import { TestContext } from "../TestContext";
import { TestiModelMetadata } from "../TestiModelMetadata";

describe("[Management] BriefcaseOperations", () => {
  let testContext: TestContext;
  let imodelsClient: iModelsClient;
  let defaultiModel: iModel;

  before(async () => {
    testContext = new TestContext({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementBriefcaseOperations"
      }
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
    defaultiModel = await findiModelWithName({ imodelsClient, testContext, expectediModelname: Config.get().DefaultiModelName });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
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
        requestContext: testContext.RequestContext,
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
      requestContext: testContext.RequestContext,
      imodelId: defaultiModel.id,
      briefcaseId: briefcaseMetadata.id
    };

    // Act
    const briefcase: Briefcase = await imodelsClient.Briefcases.getById(getBriefcaseByIdParams);

    // Assert
    assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: {
        deviceName: briefcaseMetadata.deviceName
      }
    });
  });
});
