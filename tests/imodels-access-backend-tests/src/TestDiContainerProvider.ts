/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Container } from "inversify";
import { BaseIntegrationTestsConfig, TestUtilBootstrapper, TestUtilTypes } from "@itwin/imodels-client-test-utils";
import { IModelsAccessBackendTestsConfig } from "./IModelsAccessBackendTestsConfig";
import "reflect-metadata";

let container: Container;
export function getTestDIContainer(): Container {
  if (container)
    return container;

  container = new Container();
  TestUtilBootstrapper.bind(container);
  container.bind<BaseIntegrationTestsConfig>(TestUtilTypes.BaseIntegrationTestsConfig).to(IModelsAccessBackendTestsConfig).inSingletonScope();
  return container;
}
