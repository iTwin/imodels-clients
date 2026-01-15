/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AddIModelToRecentsParams,
  AuthorizationCallback,
  EntityListIterator,
  GetRecentIModelListParams,
  IModel,
  IModelsClient,
  IModelsClientOptions,
  MinimalIModel,
  RemoveIModelFromRecentsParams,
  take,
  toArray,
  UtilityFunctions,
} from "@itwin/imodels-client-management";
import {
  IModelMetadata,
  TestAuthorizationProvider,
  TestIModelCreator,
  TestIModelGroup,
  TestIModelGroupFactory,
  TestITwinProvider,
  TestUtilTypes,
  assertCollection,
  assertMinimalIModel,
} from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] RecentIModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let iTwinId: string;

  let testIModelGroup: TestIModelGroup;
  let testIModelForRecents1: IModelMetadata;
  let testIModelForRecents2: IModelMetadata;
  let testIModelForRecents3: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(
      TestUtilTypes.IModelsClientOptions
    );
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testITwinProvider = container.get(TestITwinProvider);
    iTwinId = await testITwinProvider.getOrCreate();

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "RecentIModelOperations",
    });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForRecents1 = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for recents 1")
    );
    testIModelForRecents2 = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for recents 2")
    );
    testIModelForRecents3 = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for recents 3")
    );
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  afterEach(async () => {
    // Clean up: ensure all test iModels are removed from recents
    for (const testIModel of [
      testIModelForRecents1,
      testIModelForRecents2,
      testIModelForRecents3,
    ]) {
      try {
        const removeFromRecentsParams: RemoveIModelFromRecentsParams = {
          authorization,
          iModelId: testIModel.id,
        };
        await iModelsClient.recentIModels.remove(removeFromRecentsParams);
      } catch {
        // Ignore errors if iModel was not in recents
      }
    }
  });

  it("should add iModel to recents", async () => {
    // Arrange
    const addToRecentsParams: AddIModelToRecentsParams = {
      authorization,
      iModelId: testIModelForRecents1.id,
    };

    // Act
    await iModelsClient.recentIModels.add(addToRecentsParams);

    // Assert
    const getRecentListParams: GetRecentIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };
    const recents: EntityListIterator<MinimalIModel> =
      iModelsClient.recentIModels.getMinimalList(getRecentListParams);
    const recentsList = await toArray(recents);
    const addedRecent = recentsList.find(
      (iModel) => iModel.id === testIModelForRecents1.id
    );
    expect(addedRecent).to.not.be.undefined;
  });

  it("should remove iModel from recents", async () => {
    // Arrange
    const addToRecentsParams: AddIModelToRecentsParams = {
      authorization,
      iModelId: testIModelForRecents1.id,
    };
    await iModelsClient.recentIModels.add(addToRecentsParams);

    // Act
    const removeFromRecentsParams: RemoveIModelFromRecentsParams = {
      authorization,
      iModelId: testIModelForRecents1.id,
    };
    await iModelsClient.recentIModels.remove(removeFromRecentsParams);

    // Assert
    const getRecentListParams: GetRecentIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };
    const recents: EntityListIterator<MinimalIModel> =
      iModelsClient.recentIModels.getMinimalList(getRecentListParams);
    const recentsList = await toArray(recents);
    const removedRecent = recentsList.find(
      (iModel) => iModel.id === testIModelForRecents1.id
    );
    expect(removedRecent).to.be.undefined;
  });

  it("should get minimal recent iModel list", async () => {
    // Arrange
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents1.id,
    });
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents2.id,
    });

    const getRecentListParams: GetRecentIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };

    // Act
    const recents: EntityListIterator<MinimalIModel> =
      iModelsClient.recentIModels.getMinimalList(getRecentListParams);

    // Assert
    await assertCollection({
      asyncIterable: recents,
      isEntityCountCorrect: (count) => count >= 2,
    });

    const recentsList = await toArray(
      iModelsClient.recentIModels.getMinimalList(getRecentListParams)
    );
    const recent1 = recentsList.find(
      (iModel) => iModel.id === testIModelForRecents1.id
    );
    const recent2 = recentsList.find(
      (iModel) => iModel.id === testIModelForRecents2.id
    );
    expect(recent1).to.not.be.undefined;
    expect(recent2).to.not.be.undefined;
    assertMinimalIModel({ actualIModel: recent1! });
    assertMinimalIModel({ actualIModel: recent2! });
  });

  it("should get representation recent iModel list", async () => {
    // Arrange
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents1.id,
    });
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents2.id,
    });

    const getRecentListParams: GetRecentIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };

    // Act
    const recents: EntityListIterator<IModel> =
      iModelsClient.recentIModels.getRepresentationList(getRecentListParams);

    // Assert
    const recentsList = await toArray(recents);
    await assertCollection({
      asyncIterable:
        iModelsClient.recentIModels.getRepresentationList(getRecentListParams),
      isEntityCountCorrect: (count) => count >= 2,
    });

    const recent1 = recentsList.find(
      (iModel) => iModel.id === testIModelForRecents1.id
    );
    const recent2 = recentsList.find(
      (iModel) => iModel.id === testIModelForRecents2.id
    );
    expect(recent1).to.not.be.undefined;
    expect(recent2).to.not.be.undefined;
    expect(recent1!.id).to.equal(testIModelForRecents1.id);
    expect(recent1!.displayName).to.be.a("string");
    expect(recent1!.name).to.be.a("string");
    expect(recent2!.id).to.equal(testIModelForRecents2.id);
    expect(recent2!.displayName).to.be.a("string");
    expect(recent2!.name).to.be.a("string");
  });

  it("should support $top parameter", async () => {
    // Arrange
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents1.id,
    });
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents2.id,
    });
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents3.id,
    });

    const getRecentListParams: GetRecentIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        $top: 2,
      },
    };

    // Act
    const recents: EntityListIterator<MinimalIModel> =
      iModelsClient.recentIModels.getMinimalList(getRecentListParams);

    // Assert
    const recentsList = await take(recents, 2);
    expect(recentsList.length).to.be.equal(2);
    assertMinimalIModel({ actualIModel: recentsList[0] });
    assertMinimalIModel({ actualIModel: recentsList[1] });
  });

  it("should return recents in order with most recent first", async () => {
    // Arrange
    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents1.id,
    });
    await UtilityFunctions.sleep(100);

    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents2.id,
    });
    await UtilityFunctions.sleep(100);

    await iModelsClient.recentIModels.add({
      authorization,
      iModelId: testIModelForRecents3.id,
    });

    const getRecentListParams: GetRecentIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };

    // Act
    const recents: EntityListIterator<MinimalIModel> =
      iModelsClient.recentIModels.getMinimalList(getRecentListParams);
    const recentsList = await toArray(recents);

    // Assert
    const index1 = recentsList.findIndex(
      (iModel) => iModel.id === testIModelForRecents1.id
    );
    const index2 = recentsList.findIndex(
      (iModel) => iModel.id === testIModelForRecents2.id
    );
    const index3 = recentsList.findIndex(
      (iModel) => iModel.id === testIModelForRecents3.id
    );

    expect(index1).to.be.greaterThanOrEqual(0);
    expect(index2).to.be.greaterThanOrEqual(0);
    expect(index3).to.be.greaterThanOrEqual(0);

    expect(index3).to.be.lessThan(index2);
    expect(index2).to.be.lessThan(index1);
  });
});
