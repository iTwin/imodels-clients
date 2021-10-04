/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, GetChangesetByIdParams, GetChangesetListParams, RequestContext, iModel, iModelsClient } from "@itwin/imodels-client-management";
import { Config, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelMetadata, assertChangeset, assertCollection, findiModelWithName } from "../common";

describe("[Management] ChangesetOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModel: iModel;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();

    testiModel = await findiModelWithName({ imodelsClient, requestContext, projectId, expectediModelname: Config.get().testiModelName });
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
        imodelId: testiModel.id,
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

    it(`should return items that belong to specified range when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        requestContext,
        imodelId: testiModel.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10
        }
      };

      // Act
      const changesets = await testCase.functionUnderTest(getChangesetListParams);

      // Assert
      assertCollection({
        asyncIterable: changesets,
        isEntityCountCorrect: count => count === (getChangesetListParams.urlParams.lastIndex - getChangesetListParams.urlParams.afterIndex)
      });
    });
  });

  it("should get changeset by id", async () => {
    // Arrange
    const changesetMetadata = TestiModelMetadata.Changesets[0];
    const getChangesetByIdParams: GetChangesetByIdParams = {
      requestContext,
      imodelId: testiModel.id,
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
