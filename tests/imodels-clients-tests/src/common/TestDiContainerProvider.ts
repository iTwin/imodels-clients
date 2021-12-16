/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Container } from "inversify";
import { BaseIntegrationTestsConfig, TestUtilBootstrapper, TestUtilTypes } from "@itwin/imodels-client-test-utils";
import { IModelsClientsTestsConfig } from "./IModelsClientsTestsConfig";

export function getTestDIContainer(): Container {
  const container = new Container();
  TestUtilBootstrapper.bind(container);
  container.bind<BaseIntegrationTestsConfig>(TestUtilTypes.BaseIntegrationTestsConfig).to(IModelsClientsTestsConfig).inSingletonScope();
  return container;
}
