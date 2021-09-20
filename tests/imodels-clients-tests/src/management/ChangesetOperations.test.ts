/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, iModelsClient, GetChangesetListParams, Changeset, GetChangesetByIdParams, RequestContext } from "@itwin/imodels-client-management";
import { assertChangeset, assertCollection, Config, findiModelWithName, TestAuthenticationProvider, TestClientOptions, TestiModelMetadata, TestProjectProvider } from "../common";

describe("[Management] ChangesetOperations", () => {
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
