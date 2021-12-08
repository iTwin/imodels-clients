/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { cleanupDirectory, cleanupIModelsInTestProject, createDirectory } from "@itwin/imodels-clients-tests";
import { Constants } from "./Constants";

before(async () => {
  await cleanupIModelsInTestProject(Constants.PackagePrefix);
  createDirectory(Constants.TestDownloadDirectoryPath);
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

after(async () => {
  await cleanupIModelsInTestProject(Constants.PackagePrefix);
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});
