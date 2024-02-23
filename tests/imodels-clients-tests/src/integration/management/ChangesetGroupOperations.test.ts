/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, GetChangesetGroupListParams, GetSingleChangesetGroupParams, IModelsClient, IModelsClientOptions, IModelsErrorCode } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes, assertChangesetGroup, assertCollection, assertError } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] ChangesetGroupOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let testIModel: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModel = await reusableTestIModelProvider.getOrCreate();
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getChangesetGroupListParams: GetChangesetGroupListParams = {
      authorization,
      iModelId: testIModel.id
    };

    // Act
    const changesetGroups = iModelsClient.changesetGroups.getList(getChangesetGroupListParams);

    // Assert
    await assertCollection({
      asyncIterable: changesetGroups,
      isEntityCountCorrect: (count) => (count > 0 && count === testIModel.changesetGroups.length)
    });
  });

  it("should get changeset group by id", async () => {
    // Arrange
    const expectedChangesetGroup = testIModel.changesetGroups[0];
    const expectedChangesetGroupProperties = { description: expectedChangesetGroup.description };
    const getSingleChangesetGroupParams: GetSingleChangesetGroupParams = {
      authorization,
      iModelId: testIModel.id,
      changesetGroupId: expectedChangesetGroup.id
    };

    // Act
    const changesetGroup = await iModelsClient.changesetGroups.getSingle(getSingleChangesetGroupParams);

    // Assert
    await assertChangesetGroup({ actualChangesetGroup: changesetGroup, expectedChangesetGroupProperties });
  });

  it("should return error when querying non-existent changeset group", async () => {
    // Arrange
    const getSingleChangesetGroupParams: GetSingleChangesetGroupParams = {
      authorization,
      iModelId: testIModel.id,
      changesetGroupId: "invalid group id"
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.changesetGroups.getSingle(getSingleChangesetGroupParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.ChangesetGroupNotFound,
        message: "Requested Changeset Group is not available."
      }
    });
  });
});
