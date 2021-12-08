/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsClient } from "@itwin/imodels-client-authoring";
import { cleanUpIModels, cleanupDirectory, createDirectory } from "./CommonTestUtils";
import { Config } from "./Config";
import { Constants } from "./Constants";
import { TestAuthorizationProvider } from "./test-context-providers/auth/TestAuthenticationProvider";
import { TestProjectProvider } from "./test-context-providers/project/TestProjectProvider";
import { TestClientOptions } from "./TestClientOptions";
import { TestIModelGroup } from "./TestIModelGroup";

before(async () => {
  await cleanupIModelsInTestProject(Constants.PackagePrefix);
  createDirectory(Constants.TestDownloadDirectoryPath);
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

after(async () => {
  await cleanupIModelsInTestProject(Constants.PackagePrefix);
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

export async function cleanupIModelsInTestProject(packagePrefix: string): Promise<void> {
  const iModelsClient = new IModelsClient(new TestClientOptions());
  const authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
  const projectId = await TestProjectProvider.getProjectId();
  const testIModelGroup = new TestIModelGroup({ labels: { package: packagePrefix } });
  await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
}
