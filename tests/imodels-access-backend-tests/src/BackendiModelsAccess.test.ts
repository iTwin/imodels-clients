/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelIdArg } from "@itwin/core-backend";
import { BriefcaseId } from "@itwin/core-common";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { expect } from "chai";
import { IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes } from "@itwin/imodels-client-test-utils";
import { getTestDIContainer } from "./TestDiContainerProvider";

describe("BackendIModelsAccess", () => {
  let backendIModelsAccess: BackendIModelsAccess;
  let accessToken: string;
  let testIModel: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModel = await reusableTestIModelProvider.getOrCreate();
  });

  it("should get current user briefcase ids", async () => {
    // Arrange
    const getMyBriefcaseIdsParams: IModelIdArg = {
      accessToken,
      iModelId: testIModel.id
    };

    // Act
    const briefcaseIds: BriefcaseId[] = await backendIModelsAccess.getMyBriefcaseIds(getMyBriefcaseIdsParams);

    // Assert
    expect(briefcaseIds.length).to.equal(1);
    const briefcaseId = briefcaseIds[0];
    expect(briefcaseId).to.equal(testIModel.briefcase.id);
  });
});
