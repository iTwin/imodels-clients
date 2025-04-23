/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

import { Container } from "inversify";

import { IModelsClientOptions } from "@itwin/imodels-client-management";
import { ReusableTestIModelProvider, TestAuthorizationProvider, TestITwinProvider, TestUtilBootstrapper, TestUtilTypes } from "@itwin/imodels-client-test-utils";

import { FrontendTestEnvVariableKeys } from "./FrontendTestEnvVariableKeys.js";

export async function setupIntegrationTests(): Promise<void> {
  const container = new Container();
  TestUtilBootstrapper.bind(container, path.join(import.meta.dirname, "../../../", ".env"));

  const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
  process.env[FrontendTestEnvVariableKeys.iModelsClientApiOptions] = JSON.stringify(iModelsClientOptions.api);

  const authorizationProvider = container.get(TestAuthorizationProvider);
  const authorizationCallback = authorizationProvider.getAdmin1Authorization();
  const authorizationInfo = await authorizationCallback();
  process.env[FrontendTestEnvVariableKeys.admin1AuthorizationInfo] = JSON.stringify(authorizationInfo);

  const testITwinProvider = container.get(TestITwinProvider);
  const iTwinId = await testITwinProvider.getOrCreate();
  process.env[FrontendTestEnvVariableKeys.testITwinId] = iTwinId;

  const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
  const testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  process.env[FrontendTestEnvVariableKeys.testIModelForReadId] = testIModelForRead.id;

  process.env[FrontendTestEnvVariableKeys.testPngFilePath] = path.join(import.meta.dirname, "../", "assets", "Sample.png");

}
