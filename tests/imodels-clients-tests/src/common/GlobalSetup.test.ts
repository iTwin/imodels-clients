/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient } from "@itwin/imodels-client-authoring";
import { cleanUpiModels, cleanupDirectory, createDirectory } from "./CommonTestUtils";
import { Config } from "./Config";
import { Constants } from "./Constants";
import { TestAuthorizationProvider } from "./test-context-providers/auth/TestAuthenticationProvider";
import { TestProjectProvider } from "./test-context-providers/project/TestProjectProvider";
import { TestClientOptions } from "./TestClientOptions";
import { TestiModelGroup } from "./TestiModelGroup";

before(async () => {
  await cleanupiModelsInTestProject();
  createDirectory(Constants.TestDownloadDirectoryPath);
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

after(async () => {
  await cleanupiModelsInTestProject();
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

async function cleanupiModelsInTestProject(): Promise<void> {
  const imodelsClient = new iModelsClient(new TestClientOptions());
  const authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
  const projectId = await TestProjectProvider.getProjectId();
  const testiModelGroup = new TestiModelGroup({ labels: { package: Constants.PackagePrefix } });
  await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
}
