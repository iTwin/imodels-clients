/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { TestProjectProvider, TestAuthorizationProvider, Config, ReusableTestIModelProvider, TestClientOptions, ReusableIModelMetadata } from "@itwin/imodels-clients-tests";
import { IModelsClient } from "@itwin/imodels-client-authoring";
import { BriefcaseId } from "@itwin/core-common";
import { IModelIdArg } from "@itwin/core-backend";
import { expect } from "chai";

describe("BackendiModelsAccess", () => {
  let backendIModelsAccess: BackendIModelsAccess;
  let accessToken: string;
  let projectId: string;
  let testIModel: ReusableIModelMetadata;

  before(async () => {
    const iModelsClient = new IModelsClient(new TestClientOptions());
    const authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);

    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);
    accessToken = `${(await authorization()).scheme} ${(await authorization()).token}`;
    projectId = await TestProjectProvider.getProjectId();
    testIModel = await ReusableTestIModelProvider.getOrCreate({
      iModelsClient,
      authorization,
      projectId
    });
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