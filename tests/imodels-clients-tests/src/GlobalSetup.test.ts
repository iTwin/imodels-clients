/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, cleanUpiModels, cleanupDirectory, createDirectory } from "./common";

before(async () => {
  console.log("global setup", Constants.TestDownloadDirectoryPath);
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
