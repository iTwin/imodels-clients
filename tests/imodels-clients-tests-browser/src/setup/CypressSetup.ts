/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsClientOptions } from "@itwin/imodels-client-management";
import { BaseIntegrationTestsConfig, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilBootstrapper, TestUtilTypes } from "@itwin/imodels-client-test-utils";
import { Container } from "inversify";
import { FrontendTestEnvVariableKeys } from "./FrontendTestEnvVariableKeys";
import { IModelsClientsTestsConfig } from "./IModelsClientsTestsConfig";

export default async function setup(_on: unknown, config: { env: any }): Promise<unknown> {
  const container = new Container();
  TestUtilBootstrapper.bind(container);
  container.bind<BaseIntegrationTestsConfig>(TestUtilTypes.BaseIntegrationTestsConfig).to(IModelsClientsTestsConfig).inSingletonScope();

  const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
  config.env[FrontendTestEnvVariableKeys.iModelsClientApiOptions] = JSON.stringify(iModelsClientOptions.api);

  const authorizationProvider = container.get(TestAuthorizationProvider);
  const authorizationCallback = authorizationProvider.getAdmin1Authorization();
  const authorizationInfo = await authorizationCallback();
  config.env[FrontendTestEnvVariableKeys.admin1AuthorizationInfo] = JSON.stringify(authorizationInfo);

  const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
  const testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  config.env[FrontendTestEnvVariableKeys.testIModelForReadId] = testIModelForRead.id;

  return config;
}
