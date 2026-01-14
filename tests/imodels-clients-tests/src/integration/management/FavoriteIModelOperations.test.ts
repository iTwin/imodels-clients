/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AddIModelToFavoritesParams,
  AuthorizationCallback,
  EntityListIterator,
  GetFavoriteIModelListParams,
  IModel,
  IModelsClient,
  IModelsClientOptions,
  MinimalIModel,
  RemoveIModelFromFavoritesParams,
  take,
  toArray,
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

describe("[Management] FavoriteIModelOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let iTwinId: string;

  let testIModelGroup: TestIModelGroup;
  let testIModelForFavorites1: IModelMetadata;
  let testIModelForFavorites2: IModelMetadata;
  let testIModelForFavorites3: IModelMetadata;

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
      testSuiteName: "FavoriteIModelOperations",
    });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForFavorites1 = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for favorites 1")
    );
    testIModelForFavorites2 = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for favorites 2")
    );
    testIModelForFavorites3 = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for favorites 3")
    );
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  afterEach(async () => {
    // Clean up: ensure all test iModels are removed from favorites
    for (const testIModel of [
      testIModelForFavorites1,
      testIModelForFavorites2,
      testIModelForFavorites3,
    ]) {
      try {
        const removeFromFavoritesParams: RemoveIModelFromFavoritesParams = {
          authorization,
          iModelId: testIModel.id,
        };
        await iModelsClient.favoriteIModels.remove(removeFromFavoritesParams);
      } catch {
        // Ignore errors if iModel was not in favorites
      }
    }
  });

  it("should add iModel to favorites", async () => {
    // Arrange
    const addToFavoritesParams: AddIModelToFavoritesParams = {
      authorization,
      iModelId: testIModelForFavorites1.id,
    };

    // Act
    await iModelsClient.favoriteIModels.add(addToFavoritesParams);

    // Assert
    const getFavoriteListParams: GetFavoriteIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };
    const favorites: EntityListIterator<MinimalIModel> =
      iModelsClient.favoriteIModels.getMinimalList(getFavoriteListParams);
    const favoritesList = await toArray(favorites);
    const addedFavorite = favoritesList.find(
      (iModel) => iModel.id === testIModelForFavorites1.id
    );
    expect(addedFavorite).to.not.be.undefined;
  });

  it("should remove iModel from favorites", async () => {
    // Arrange
    const addToFavoritesParams: AddIModelToFavoritesParams = {
      authorization,
      iModelId: testIModelForFavorites1.id,
    };
    await iModelsClient.favoriteIModels.add(addToFavoritesParams);

    // Act
    const removeFromFavoritesParams: RemoveIModelFromFavoritesParams = {
      authorization,
      iModelId: testIModelForFavorites1.id,
    };
    await iModelsClient.favoriteIModels.remove(removeFromFavoritesParams);

    // Assert
    const getFavoriteListParams: GetFavoriteIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };
    const favorites: EntityListIterator<MinimalIModel> =
      iModelsClient.favoriteIModels.getMinimalList(getFavoriteListParams);
    const favoritesList = await toArray(favorites);
    const removedFavorite = favoritesList.find(
      (iModel) => iModel.id === testIModelForFavorites1.id
    );
    expect(removedFavorite).to.be.undefined;
  });

  it("should get minimal favorite iModel list", async () => {
    // Arrange
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites1.id,
    });
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites2.id,
    });

    const getFavoriteListParams: GetFavoriteIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };

    // Act
    const favorites: EntityListIterator<MinimalIModel> =
      iModelsClient.favoriteIModels.getMinimalList(getFavoriteListParams);

    // Assert
    await assertCollection({
      asyncIterable: favorites,
      isEntityCountCorrect: (count) => count >= 2,
    });

    const favoritesList = await toArray(
      iModelsClient.favoriteIModels.getMinimalList(getFavoriteListParams)
    );
    const favorite1 = favoritesList.find(
      (iModel) => iModel.id === testIModelForFavorites1.id
    );
    const favorite2 = favoritesList.find(
      (iModel) => iModel.id === testIModelForFavorites2.id
    );
    expect(favorite1).to.not.be.undefined;
    expect(favorite2).to.not.be.undefined;
    assertMinimalIModel({ actualIModel: favorite1! });
    assertMinimalIModel({ actualIModel: favorite2! });
  });

  it("should get representation favorite iModel list", async () => {
    // Arrange
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites1.id,
    });
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites2.id,
    });

    const getFavoriteListParams: GetFavoriteIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
      },
    };

    // Act
    const favorites: EntityListIterator<IModel> =
      iModelsClient.favoriteIModels.getRepresentationList(
        getFavoriteListParams
      );

    // Assert
    const favoritesList = await toArray(favorites);
    await assertCollection({
      asyncIterable: iModelsClient.favoriteIModels.getRepresentationList(
        getFavoriteListParams
      ),
      isEntityCountCorrect: (count) => count >= 2,
    });

    const favorite1 = favoritesList.find(
      (iModel) => iModel.id === testIModelForFavorites1.id
    );
    const favorite2 = favoritesList.find(
      (iModel) => iModel.id === testIModelForFavorites2.id
    );
    expect(favorite1).to.not.be.undefined;
    expect(favorite2).to.not.be.undefined;
    expect(favorite1!.id).to.equal(testIModelForFavorites1.id);
    expect(favorite1!.displayName).to.be.a("string");
    expect(favorite1!.name).to.be.a("string");
    expect(favorite2!.id).to.equal(testIModelForFavorites2.id);
    expect(favorite2!.displayName).to.be.a("string");
    expect(favorite2!.name).to.be.a("string");
  });

  it("should support $top parameter", async () => {
    // Arrange
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites1.id,
    });
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites2.id,
    });
    await iModelsClient.favoriteIModels.add({
      authorization,
      iModelId: testIModelForFavorites3.id,
    });

    const getFavoriteListParams: GetFavoriteIModelListParams = {
      authorization,
      urlParams: {
        iTwinId,
        $top: 2,
      },
    };

    // Act
    const favorites: EntityListIterator<MinimalIModel> =
      iModelsClient.favoriteIModels.getMinimalList(getFavoriteListParams);

    // Assert
    const favoritesList = await take(favorites, 2);
    expect(favoritesList.length).to.be.equal(2);
    assertMinimalIModel({ actualIModel: favoritesList[0] });
    assertMinimalIModel({ actualIModel: favoritesList[1] });
  });
});
