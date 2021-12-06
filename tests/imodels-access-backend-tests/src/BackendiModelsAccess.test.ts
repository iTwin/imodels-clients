/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BackendiModelsAccess } from "@itwin/imodels-access-backend";
import { iModelMetadata, TestProjectProvider, TestAuthorizationProvider, Config, ReusableTestiModelProvider, TestClientOptions } from "@itwin/imodels-clients-tests";
import { iModelsClient } from "@itwin/imodels-client-authoring";

describe("BackendiModelsAccess", () => {
  let backendiModelsAccess: BackendiModelsAccess;
  let accessToken: string;
  let projectId: string;
  let testiModel: iModelMetadata;

  before(async () => {
    const authorizationCallback = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    projectId = await TestProjectProvider.getProjectId();
    testiModel = await ReusableTestiModelProvider.getOrCreate({
      imodelsClient: new iModelsClient(new TestClientOptions()),
      authorization: authorizationCallback,
      projectId
    });
  });

  it("shoud", async () => {
    backendiModelsAccess.getMyBriefcaseIds({ iModelId: testiModel.id });
  });
});