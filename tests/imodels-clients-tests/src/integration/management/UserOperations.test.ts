/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { AuthorizationCallback, EntityListIterator, GetSingleUserParams, GetUserListParams, IModelsClient, IModelsClientOptions, MinimalUser, User, take, toArray } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes, assertCollection, assertMinimalUser, assertUser } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] UserOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForRead: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetUserListParams) => iModelsClient.users.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetUserListParams) => iModelsClient.users.getRepresentationList(params)
    }
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getUserListParams: GetUserListParams = {
        authorization,
        iModelId: testIModelForRead.id
      };

      // Act
      const users: EntityListIterator<unknown> = testCase.functionUnderTest(getUserListParams);

      // Assert
      await assertCollection({
        asyncIterable: users,
        isEntityCountCorrect: (count) => count === 2
      });
    });
  });

  it("should get minimal user", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        $top: 1
      }
    };

    // Act
    const minimalUsers: EntityListIterator<MinimalUser> = iModelsClient.users.getMinimalList(getUserListParams);

    // Assert
    const minimalUserList = await take(minimalUsers, 1);
    expect(minimalUserList.length).to.be.equal(1);
    const minimalUser = minimalUserList[0];
    assertMinimalUser({
      actualUser: minimalUser
    });
  });

  it("should get user by id", async () => {
    // Arrange
    const userId = await getValidUserId();
    const getSingleUserParams: GetSingleUserParams = {
      authorization,
      iModelId: testIModelForRead.id,
      userId
    };

    // Act
    const user: User = await iModelsClient.users.getSingle(getSingleUserParams);

    // Assert
    assertUser({
      actualUser: user
    });
  });

  async function getValidUserId(): Promise<string> {
    const users: EntityListIterator<MinimalUser> = iModelsClient.users.getMinimalList({
      authorization,
      iModelId: testIModelForRead.id
    });
    const userList: MinimalUser[] = await toArray(users);
    return userList[0].id;
  }
});
