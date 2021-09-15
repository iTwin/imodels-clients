/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, iModelsClient, GetChangesetListParams, Changeset, GetChangesetByIdParams, RequestContext } from "@itwin/imodels-client-management";
import { assertChangeset, assertCollection } from "../AssertionUtils";
import { cleanUpiModels, findiModelWithName } from "../CommonTestUtils";
import { Config } from "../Config";
import { Constants } from "../Constants";
import { TestContext } from "../TestContext";
import { TestiModelMetadata } from "../TestiModelMetadata";

describe("[Management] ChangesetOperations", () => {
  let testContext: TestContext;
  let imodelsClient: iModelsClient;
  let defaultiModel: iModel;
  let requestContext: RequestContext;

  before(async () => {
    testContext = new TestContext({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementChangesetOperations"
      }
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
    defaultiModel = await findiModelWithName({ imodelsClient, testContext, expectediModelname: Config.get().defaultiModelName });
    requestContext = await testContext.getRequestContext();
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetChangesetListParams) => imodelsClient.Changesets.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetChangesetListParams) => imodelsClient.Changesets.getRepresentationList(params)
    }
  ].forEach(testCase => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        requestContext,
        imodelId: defaultiModel.id,
        urlParams: {
          $top: 5
        }
      };

      // Act
      const changesets = await testCase.functionUnderTest(getChangesetListParams);

      // Assert
      assertCollection({
        asyncIterable: changesets,
        isEntityCountCorrect: count => count === TestiModelMetadata.Changesets.length
      });
    });
  });

  it("should get changeset by id", async () => {
    // Arrange
    const changesetMetadata = TestiModelMetadata.Changesets[0];
    const getChangesetByIdParams: GetChangesetByIdParams = {
      requestContext,
      imodelId: defaultiModel.id,
      changesetId: changesetMetadata.id
    };

    // Act
    const changeset: Changeset = await imodelsClient.Changesets.getById(getChangesetByIdParams);

    // Assert
    assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: changesetMetadata.id,
        briefcaseId: TestiModelMetadata.Briefcase.id,
        parentId: changesetMetadata.parentId,
        description: changesetMetadata.description,
        containingChanges: changesetMetadata.containingChanges,
        changesetFilePath: changesetMetadata.changesetFilePath
      }
    });
  });
});
