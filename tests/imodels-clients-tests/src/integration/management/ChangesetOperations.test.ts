/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { AuthorizationCallback, Changeset, ChangesetOrderByProperty, EntityListIterator, GetChangesetListParams, GetSingleChangesetParams, IModelsClient, IModelsClientOptions, MinimalChangeset, OrderByOperator, toArray } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelFileProvider, TestUtilTypes, assertChangeset, assertCollection, assertMinimalChangeset } from "@itwin/imodels-client-test-utils";

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

  it("should get valid minimal changeset when querying minimal collection", async () => {
    // Arrange
    const getChangesetListParams: GetChangesetListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        afterIndex: 0,
        lastIndex: 1,
        $orderBy: {
          property: ChangesetOrderByProperty.Index,
          operator: OrderByOperator.Descending
        }
      }
    };

    // Act
    const minimalChangesets: EntityListIterator<MinimalChangeset> =
      iModelsClient.changesets.getMinimalList(getChangesetListParams);

    // Assert
    const minimalChangesetList = await toArray(minimalChangesets);
    expect(minimalChangesetList.length).to.be.equal(1);
    const minimalChangeset = minimalChangesetList[0];
    const testChangesetFile = testIModelFileProvider.changesets[minimalChangeset.index - 1];
    await assertMinimalChangeset({
      actualChangeset: minimalChangeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIModel.briefcase.id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges
      },
      expectedTestChangesetFile: testChangesetFile
    });
  });

  it("should get valid full changeset when querying representation collection", async () => {
    // Arrange
    const firstNamedVersion = testIModel.namedVersions[0];
    const getChangesetListParams: GetChangesetListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        afterIndex: firstNamedVersion.changesetIndex - 1,
        lastIndex: firstNamedVersion.changesetIndex
      }
    };

    // Act
    const changesets: EntityListIterator<Changeset> =
      iModelsClient.changesets.getRepresentationList(getChangesetListParams);

    // Assert
    const changesetList: Changeset[] = await toArray(changesets);
    expect(changesetList.length).to.be.equal(1);
    const changeset = changesetList[0];
    const testChangesetFile = testIModelFileProvider.changesets[changeset.index - 1];
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIModel.briefcase.id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        synchronizationInfo: testChangesetFile.synchronizationInfo
      },
      expectedTestChangesetFile: testChangesetFile,
      expectedLinks: {
        namedVersion: true,
        checkpoint: true
      },
      isGetResponse: true
    });
  });

  it("should get changeset by id", async () => {
    // Arrange
    const firstNamedVersion = testIModel.namedVersions[0];
    const changesetWithNamedVersionIndex = firstNamedVersion.changesetIndex;
    const testChangesetFile = testIModelFileProvider.changesets[changesetWithNamedVersionIndex - 1];
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization,
      iModelId: testIModel.id,
      changesetId: testChangesetFile.id
    };

    // Act
    const changeset: Changeset = await iModelsClient.changesets.getSingle(getSingleChangesetParams);

    // Assert
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIModel.briefcase.id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        synchronizationInfo: testChangesetFile.synchronizationInfo
      },
      expectedTestChangesetFile: testChangesetFile,
      expectedLinks: {
        namedVersion: true,
        checkpoint: true
      },
      isGetResponse: true
    });
  });
});
