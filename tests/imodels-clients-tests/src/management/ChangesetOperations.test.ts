/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, Changeset, ChangesetOrderByProperty, GetChangesetListParams, GetSingleChangesetParams, IModelsClient, IModelsClientOptions, OrderByOperator, toArray } from "@itwin/imodels-client-management";
import { NamedVersionMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelFileProvider, TestUtilTypes, assertChangeset, assertCollection } from "@itwin/imodels-client-test-utils";
import { getTestDIContainer } from "../common";

describe("[Management] ChangesetOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let testIModel: ReusableIModelMetadata;
  let testIModelFileProvider: TestIModelFileProvider;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModel = await reusableTestIModelProvider.getOrCreate();
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetChangesetListParams) => iModelsClient.changesets.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetChangesetListParams) => iModelsClient.changesets.getRepresentationList(params)
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
        isEntityCountCorrect: (count) => count === testIModelFileProvider.changesets.length
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
    const testChangesetFile = testIModelFileProvider.changesets[0];
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization,
      iModelId: testIModel.id,
      changesetId: testChangesetFile.id
    };

    // Act
    const changeset: Changeset = await iModelsClient.changesets.getSingle(getSingleChangesetParams);

    // Assert
    assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIModel.briefcase.id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        synchronizationInfo: testChangesetFile.synchronizationInfo
      },
      expectedTestChangesetFile: testChangesetFile
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
      const changesets = iModelsClient.changesets.getRepresentationList(getChangesetListParams);

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
      const changeset: Changeset = await iModelsClient.changesets.getSingle(getSingleChangesetParams);

      // Assert
      const checkpoint = await changeset.getCurrentOrPrecedingCheckpoint();
      expect(checkpoint).to.not.be.undefined;
      expect(checkpoint!.changesetIndex).to.equal(firstNamedVersion.changesetIndex);
    });
  });
});
