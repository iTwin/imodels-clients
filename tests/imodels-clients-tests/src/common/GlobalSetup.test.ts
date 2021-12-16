/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { TestIModelGroupFactory, cleanupDirectory, createDirectory, createGuidValue } from "@itwin/imodels-client-test-utils";
import { Constants } from "./Constants";
import { getTestDIContainer } from "./TestDiContainerProvider";

let testInstanceId: string;
export function getTestRunId(): string {
  if (!testInstanceId)
    testInstanceId = createGuidValue();
  return testInstanceId;
}

before(async () => {
  await cleanupIModelsInTestProject();
  createDirectory(Constants.TestDownloadDirectoryPath);
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

after(async () => {
  await cleanupIModelsInTestProject();
  cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

async function cleanupIModelsInTestProject(): Promise<void> {
  const container = getTestDIContainer();
  const testIModelGroupFactory = container.get<TestIModelGroupFactory>(TestIModelGroupFactory);
  const testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix });
  await testIModelGroup.cleanupIModels();
}
