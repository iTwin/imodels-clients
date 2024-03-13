/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";

import { AuthorizationCallback, GetCreateIModelOperationDetailsParams, IModelCreationState, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] OperationOperations", () => {
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

  it("should get create iModel operation details", async () => {
    // Arrange
    const operationParams: GetCreateIModelOperationDetailsParams = {
      authorization,
      iModelId: testIModel.id
    };

    // Act
    const operationDetails = await iModelsClient.operations.getCreateIModelDetails(operationParams);

    // Assert
    expect(operationDetails.clonedFrom).to.be.null;
    expect(operationDetails.state).to.equal(IModelCreationState.Successful);
  });
});
