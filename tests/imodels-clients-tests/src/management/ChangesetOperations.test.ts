/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { IModelsClient as AuthoringIModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, Changeset, ChangesetOrderByProperty, GetChangesetListParams, GetSingleChangesetParams, IModelsClient, IModelsClientOptions, OrderByOperator,toArray } from "@itwin/imodels-client-management";
import { Config, NamedVersionMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestClientOptions, TestIModelFileProvider, TestProjectProvider, assertChangeset, assertCollection } from "../common";

describe("[Management] ChangesetOperations", () => {
  let iModelsClientOptions: IModelsClientOptions;
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModel: ReusableIModelMetadata;

  before(async () => {
    iModelsClientOptions = new TestClientOptions();
    iModelsClient = new IModelsClient(iModelsClientOptions);
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
      functionUnderTest: (params: GetChangesetListParams) => iModelsClient.Changesets.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetChangesetListParams) => iModelsClient.Changesets.getRepresentationList(params)
    }
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          $top: 5
        }
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      await assertCollection({
        asyncIterable: changesets,
        isEntityCountCorrect: (count) => count === TestIModelFileProvider.changesets.length
      });
    });

    it(`should return items in ascending order when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          $orderBy: {
            property: ChangesetOrderByProperty.Index
          }
        }
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      const changesetIndexes = (await toArray(changesets)).map((changeset) => changeset.index);
      for (let i = 0; i < changesetIndexes.length - 1; i++)
        expect(changesetIndexes[i]).to.be.lessThan(changesetIndexes[i + 1]);
    });

    it(`should return items in descending order when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          $orderBy: {
            property: ChangesetOrderByProperty.Index,
            operator: OrderByOperator.Descending
          }
        }
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      const changesetIndexes = (await toArray(changesets)).map((changeset) => changeset.index);
      for (let i = 0; i < changesetIndexes.length - 1; i++)
        expect(changesetIndexes[i]).to.be.greaterThan(changesetIndexes[i + 1]);
    });

    it(`should return items that belong to specified range when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10
        }
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      await assertCollection({
        asyncIterable: changesets,
        isEntityCountCorrect: (count) => count === (getChangesetListParams.urlParams!.lastIndex! - getChangesetListParams.urlParams!.afterIndex!)
      });
    });

    it(`should allow to combine url parameters when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10,
          $orderBy: {
            property: ChangesetOrderByProperty.Index,
            operator: OrderByOperator.Descending
          }
        }
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      const changesetIndexes = (await toArray(changesets)).map((changeset) => changeset.index);
      expect(changesetIndexes).to.deep.equal([10, 9, 8, 7, 6]);
    });
  });

  it("should get changeset by id", async () => {
    // Arrange
    const expectedChangeset = TestIModelFileProvider.changesets[0];
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization,
      iModelId: testIModel.id,
      changesetId: expectedChangeset.id
    };

    // Act
    const changeset: Changeset = await iModelsClient.Changesets.getSingle(getSingleChangesetParams);

    // Assert
    assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: expectedChangeset.id,
        briefcaseId: testIModel.briefcase.id,
        parentId: expectedChangeset.parentId,
        description: expectedChangeset.description,
        containingChanges: expectedChangeset.containingChanges
      }
    });
  });

  describe("link to checkpoint", () => {
    let firstNamedVersion: NamedVersionMetadata;

    before(() => {
      firstNamedVersion = testIModel.namedVersions[0];
    });

    it("should contain a link to checkpoint when querying representation collection", async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          lastIndex: firstNamedVersion.changesetIndex
        }
      };

      // Act
      const changesets = iModelsClient.Changesets.getRepresentationList(getChangesetListParams);

      // Assert
      for await (const changeset of changesets) {
        const checkpoint = await changeset.getCurrentOrPrecedingCheckpoint();
        expect(checkpoint).to.not.be.undefined;
        const expectedCheckpointChangesetIndex = changeset.index === firstNamedVersion.changesetIndex
          ? firstNamedVersion.changesetIndex
          : 0;
        expect(checkpoint!.changesetIndex).to.equal(expectedCheckpointChangesetIndex);
      }
    });

    it("should contain a link to checkpoint when querying changeset by id", async () => {
      // Arrange
      const getSingleChangesetParams: GetSingleChangesetParams = {
        authorization,
        iModelId: testIModel.id,
        changesetId: firstNamedVersion.changesetId
      };

      // Act
      const changeset: Changeset = await iModelsClient.Changesets.getSingle(getSingleChangesetParams);

      // Assert
      const checkpoint = await changeset.getCurrentOrPrecedingCheckpoint();
      expect(checkpoint).to.not.be.undefined;
      expect(checkpoint!.changesetIndex).to.equal(firstNamedVersion.changesetIndex);
    });
  });
});
