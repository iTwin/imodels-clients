/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

import { Container } from "inversify";

import { IModelsClientOptions } from "@itwin/imodels-client-management";
import { ReusableTestIModelProvider, TestAuthorizationProvider, TestITwinProvider, TestUtilBootstrapper, TestUtilTypes } from "@itwin/imodels-client-test-utils";

import { FrontendTestEnvVariableKeys } from "./FrontendTestEnvVariableKeys";

export async function setupIntegrationTests(_on: unknown, config: { env: any }): Promise<unknown> {
  const container = new Container();
  TestUtilBootstrapper.bind(container, path.join(__dirname, "..", ".env"));

  const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
  config.env[FrontendTestEnvVariableKeys.iModelsClientApiOptions] = JSON.stringify(iModelsClientOptions.api);

  const authorizationProvider = container.get(TestAuthorizationProvider);
  const authorizationCallback = authorizationProvider.getAdmin1Authorization();
  const authorizationInfo = await authorizationCallback();
  config.env[FrontendTestEnvVariableKeys.admin1AuthorizationInfo] = JSON.stringify(authorizationInfo);

  const testITwinProvider = container.get(TestITwinProvider);
  const iTwinId = await testITwinProvider.getOrCreate();
  config.env[FrontendTestEnvVariableKeys.testITwinId] = iTwinId;

  const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
  const testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  config.env[FrontendTestEnvVariableKeys.testIModelForReadId] = testIModelForRead.id;

  config.env[FrontendTestEnvVariableKeys.testPngFilePath] = path.join(__dirname, "assets", "Sample.png");

  return config;
}
