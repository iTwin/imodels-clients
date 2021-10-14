/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { Changeset, GetChangesetByIdParams, GetChangesetListParams, RequestContext, iModelsClient, iModelsClientOptions } from "@itwin/imodels-client-management";
import { expect } from "chai";
import { Config, TestAuthenticationProvider, TestClientOptions, assertChangeset, assertCollection, TestProjectProvider, ReusableTestiModelProvider, TestiModelNamedVersion, TestiModelWithChangesetsAndNamedVersions } from "../common";

describe("[Management] ChangesetOperations", () => {
  let imodelsClientOptions: iModelsClientOptions;
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModel: TestiModelWithChangesetsAndNamedVersions;

  before(async () => {
    imodelsClientOptions = new TestClientOptions();
    imodelsClient = new iModelsClient(imodelsClientOptions);
    requestContext = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.user1);
    projectId = await TestProjectProvider.getProjectId();
    testiModel = await ReusableTestiModelProvider.getOrCreate({
      imodelsClient: new AuthoringiModelsClient(new TestClientOptions()),
      requestContext,
      projectId
    });
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
        isEntityCountCorrect: count => count === testiModel.changesets.length
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
        isEntityCountCorrect: count => count === (getChangesetListParams.urlParams!.lastIndex! - getChangesetListParams.urlParams!.afterIndex!)
      });
    });
  });

  it("should get changeset by id", async () => {
    // Arrange
    const expectedChangeset = testiModel.changesets[0];
    const getChangesetByIdParams: GetChangesetByIdParams = {
      requestContext,
      imodelId: testiModel.id,
      changesetId: expectedChangeset.id
    };

    // Act
    const changeset: Changeset = await imodelsClient.Changesets.getById(getChangesetByIdParams);

    // Assert
    assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: expectedChangeset.id,
        briefcaseId: testiModel.briefcase.id,
        parentId: expectedChangeset.parentId,
        description: expectedChangeset.description,
        containingChanges: expectedChangeset.containingChanges
      }
    });
  });

  describe("link to checkpoint", () => {
    let firstNamedVersion: TestiModelNamedVersion;

    before(async () => {
      firstNamedVersion = testiModel.namedVersions[0];
    });

    it("should contain a link to checkpoint when querying representation collection", async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        requestContext,
        imodelId: testiModel.id,
        urlParams: {
          lastIndex: firstNamedVersion.changesetIndex
        }
      };

      // Act
      const changesets = imodelsClient.Changesets.getRepresentationList(getChangesetListParams);

      // Assert
      for await (const changeset of changesets) {
        expect(changeset._links.currentOrPrecedingCheckpoint?.href).to.not.be.undefined;

        const changesetsUrl = `${adjustBaseUrl(imodelsClientOptions.api!.baseUri!)}/${testiModel.id}/changesets`;
        let expectedLinkToCheckpoint = changeset.index === firstNamedVersion.changesetIndex
          ? `${changesetsUrl}/${firstNamedVersion.changesetIndex}/checkpoint`
          : `${changesetsUrl}/0/checkpoint`;
        expect(changeset._links.currentOrPrecedingCheckpoint!.href).to.equal(expectedLinkToCheckpoint);
      }
    });

    it("should contain a link to checkpoint when querying changeset by id", async () => {
      // Arrange
      const getChangesetByIdParams: GetChangesetByIdParams = {
        requestContext,
        imodelId: testiModel.id,
        changesetId: firstNamedVersion.changesetId
      };

      // Act
      const changeset: Changeset = await imodelsClient.Changesets.getById(getChangesetByIdParams);

      // Assert
      expect(changeset._links.currentOrPrecedingCheckpoint?.href).to.not.be.undefined;
      expect(changeset._links.currentOrPrecedingCheckpoint!.href).to.equal(`${adjustBaseUrl(imodelsClientOptions.api!.baseUri!)}/${testiModel.id}/changesets/${firstNamedVersion.changesetIndex}/checkpoint`);
    });

    // TODO: remove this after bug #701035 is fixed
    function adjustBaseUrl(baseUrl: string): string {
      return baseUrl.replace("imodels", "iModels");
    }
  });
});
