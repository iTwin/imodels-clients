/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, ChangesetExtendedData, CreateChangesetExtendedDataParams, GetSingleChangesetExtendedDataParams, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { IModelMetadata, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, assertChangesetExtendedData } from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] ChangesetExtendedDataOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModel: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "AuthoringChangesetExtendedDataOperations" });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModel = await testIModelCreator.createEmptyAndUploadChangesets(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("create changeset extended data", async () => {
    // Arrange
    const applicationJsonString = "{\"some key\": \"some value\"}";
    const expectedDataObject: object = JSON.parse(applicationJsonString);
    const expectedChangesetExtendedData = {
      changesetId: testIModelFileProvider.changesets[0].id,
      changesetIndex: 1,
      data: expectedDataObject
    };

    const createChangesetExtendedDataParams: CreateChangesetExtendedDataParams = {
      authorization,
      iModelId: testIModel.id,
      changesetExtendedDataProperties: {
        data: expectedDataObject
      },
      changeset: { changesetIndex: expectedChangesetExtendedData.changesetIndex }
    };

    // Act
    const changesetExtendedData: ChangesetExtendedData = await iModelsClient.changesetExtendedData.create(createChangesetExtendedDataParams);

    assertChangesetExtendedData({
      actualChangesetExtendedData: changesetExtendedData,
      expectedChangesetExtendedData
    });

    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams = {
      authorization,
      iModelId: testIModel.id,
      changesetIndex: expectedChangesetExtendedData.changesetIndex
    };

    const singleChangesetExtendedData: ChangesetExtendedData = await iModelsClient.changesetExtendedData.getSingle(getSingleChangesetExtendedDataParams);

    assertChangesetExtendedData({
      actualChangesetExtendedData: singleChangesetExtendedData,
      expectedChangesetExtendedData
    });
  });
});
