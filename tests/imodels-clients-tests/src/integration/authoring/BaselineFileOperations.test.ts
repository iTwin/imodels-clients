/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, BaselineFile, BaselineFileState, GetSingleBaselineFileParams, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { IModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelFileProvider, TestUtilTypes, assertBaselineFile } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Authoring] BaselineFileOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelForRead: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  it("should return baseline file by iModel id", async () => {
    // Arrange
    const getSingleBaselineFileParams: GetSingleBaselineFileParams = {
      authorization,
      iModelId: testIModelForRead.id
    };

    // Act
    const baselineFile: BaselineFile = await iModelsClient.baselineFiles.getSingle(getSingleBaselineFileParams);

    // Assert
    await assertBaselineFile({
      actualBaselineFile: baselineFile,
      expectedBaselineFileProperties: {
        state: BaselineFileState.Initialized
      },
      expectedTestBaselineFile: testIModelFileProvider.iModel
    });
  });
});
