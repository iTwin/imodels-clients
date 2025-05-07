/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AuthorizationCallback,
  GetChangesetExtendedDataListParams,
  GetSingleChangesetExtendedDataParams,
  IModelsClient,
  IModelsClientOptions,
  IModelsErrorCode,
  take,
} from "@itwin/imodels-client-management";
import {
  ReusableIModelMetadata,
  ReusableTestIModelProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
  assertChangesetExtendedData,
  assertCollection,
  assertError,
} from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] ChangesetExtendedDataOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let testIModel: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(
      TestUtilTypes.IModelsClientOptions
    );
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(
      ReusableTestIModelProvider
    );
    testIModel = await reusableTestIModelProvider.getOrCreate();
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization,
        iModelId: testIModel.id,
      };
    // Act
    const changesetExtendedData = iModelsClient.changesetExtendedData.getList(
      getChangesetExtendedDataListParams
    );

    // Assert
    await assertCollection({
      asyncIterable: changesetExtendedData,
      isEntityCountCorrect: (count) =>
        count > 0 && count === testIModel.changesetExtendedData.length,
    });
  });

  it("should get valid changeset extended data when querying collection", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          $top: 1,
        },
      };
    // Act
    const changesetExtendedData = iModelsClient.changesetExtendedData.getList(
      getChangesetExtendedDataListParams
    );

    // Assert
    const changesetExtendedDataList = await take(changesetExtendedData, 1);
    expect(changesetExtendedDataList.length).to.be.equal(1);
    const actualChangesetExtendedData = changesetExtendedDataList[0];
    const expectedChangesetExtendedData = testIModel.changesetExtendedData.find(
      (x) => x.changesetIndex === actualChangesetExtendedData.changesetIndex
    );
    expect(actualChangesetExtendedData).to.exist;
    assertChangesetExtendedData({
      actualChangesetExtendedData,
      expectedChangesetExtendedData: expectedChangesetExtendedData!,
    });
  });

  it("should get changeset extended data by changeset index", async () => {
    // Arrange
    const expectedChangesetExtendedData = testIModel.changesetExtendedData[0];
    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iModelId: testIModel.id,
        changesetIndex: expectedChangesetExtendedData.changesetIndex,
      };

    // Act
    const changesetExtendedData =
      await iModelsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );

    // Assert
    assertChangesetExtendedData({
      actualChangesetExtendedData: changesetExtendedData,
      expectedChangesetExtendedData,
    });
  });

  it("should return error when querying non-existent changeset extended data", async () => {
    // Arrange
    const notExistingChangesetExtendedData =
      testIModel.changesetExtendedData.length + 1;
    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iModelId: testIModel.id,
        changesetIndex: notExistingChangesetExtendedData,
      };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.ChangesetExtendedDataNotFound,
        message: "Requested Changeset Extended Data is not available.",
      },
    });
  });
});
