/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";

import {
  AuthorizationCallback,
  ClonedFrom,
  GetCreateIModelOperationDetailsParams,
  IModelCreationState,
  IModelsClient,
  IModelsClientOptions,
} from "@itwin/imodels-client-management";
import {
  ReusableIModelMetadata,
  ReusableTestIModelProvider,
  TestAuthorizationProvider,
  TestIModelFileProvider,
  TestIModelGroup,
  TestIModelGroupFactory,
  TestITwinProvider,
  TestUtilTypes,
} from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] OperationOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let iTwinId: string;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModel: ReusableIModelMetadata;
  let testIModelGroup: TestIModelGroup;

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

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementOperationOperations",
    });

    const reusableTestIModelProvider = container.get(
      ReusableTestIModelProvider
    );
    testIModel = await reusableTestIModelProvider.getOrCreate();
  });

  it("should get create iModel operation details", async () => {
    // Arrange
    const operationParams: GetCreateIModelOperationDetailsParams = {
      authorization,
      iModelId: testIModel.id,
    };

    // Act
    const operationDetails =
      await iModelsClient.operations.getCreateIModelDetails(operationParams);

    // Assert
    expect(operationDetails.clonedFrom).to.be.null;
    expect(operationDetails.state).to.equal(IModelCreationState.Successful);
  });

  it("should get create iModel operation details of cloned iModel", async () => {
    // Arrange
    const expectedClonedFrom: ClonedFrom = {
      iModelId: testIModel.id,
      changesetId: testIModelFileProvider.changesets[0].id,
    };
    const newIModel = await iModelsClient.iModels.clone({
      authorization,
      iModelId: expectedClonedFrom.iModelId,
      iModelProperties: {
        iTwinId,
        name: testIModelGroup.getPrefixedUniqueIModelName(
          "cloned iModel for get create iModel operation details"
        ),
        changesetId: expectedClonedFrom.changesetId,
      },
    });
    const operationParams: GetCreateIModelOperationDetailsParams = {
      authorization,
      iModelId: newIModel.id,
    };

    // Act
    const operationDetails =
      await iModelsClient.operations.getCreateIModelDetails(operationParams);

    // Assert
    expect(operationDetails.clonedFrom).to.deep.equal(expectedClonedFrom);
    expect(operationDetails.state).to.equal(IModelCreationState.Successful);
  });
});
