/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Container } from "inversify";

import { IModelsClientOptions } from "@itwin/imodels-client-authoring";

import { IModelsClientsTestsConfig } from "./IModelsClientsTestsConfig.js";
import { ITwinsClient, ITwinsClientConfig, ReusableTestIModelProvider, ReusableTestIModelProviderConfig, TestAuthorizationClient, TestAuthorizationClientConfig, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelRetriever, TestIModelsClient, TestIModelsClientOptions, TestITwinProvider, TestITwinProviderConfig } from "./test-context-providers/index.js";
import { TestAuthorizationProviderConfig } from "./test-context-providers/auth/TestAuthorizationProviderConfig.js";
import { TestIModelGroupFactory } from "./test-imodel-group/TestIModelGroupFactory.js";
import { TestUtilTypes } from "./TestUtilTypes.js";

export class TestUtilBootstrapper {
  public static bind(container: Container, envFilePath: string): void {
    const config = new IModelsClientsTestsConfig(envFilePath);
    container.bind(IModelsClientsTestsConfig).toConstantValue(config);

    TestUtilBootstrapper.bindContextProviders(container);

    container.bind(TestIModelGroupFactory).toSelf().inSingletonScope();
  }

  private static bindContextProviders(container: Container): void {
    container.bind(TestAuthorizationClientConfig).toSelf().inSingletonScope();
    container.bind(TestAuthorizationClient).toSelf().inSingletonScope();
    container.bind(TestAuthorizationProviderConfig).toSelf().inSingletonScope();
    container.bind(TestAuthorizationProvider).toSelf().inSingletonScope();

    container.bind(ITwinsClientConfig).toSelf().inSingletonScope();
    container.bind(ITwinsClient).toSelf().inSingletonScope();
    container.bind(TestITwinProviderConfig).toSelf().inSingletonScope();
    container.bind(TestITwinProvider).toSelf().inSingletonScope();

    container.bind<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions).to(TestIModelsClientOptions).inSingletonScope();
    container.bind(TestIModelsClient).toSelf().inSingletonScope();
    container.bind(ReusableTestIModelProviderConfig).toSelf().inSingletonScope();
    container.bind(ReusableTestIModelProvider).toSelf().inSingletonScope();
    container.bind(TestIModelCreator).toSelf().inSingletonScope();
    container.bind(TestIModelFileProvider).toSelf().inSingletonScope();
    container.bind(TestIModelRetriever).toSelf().inSingletonScope();
  }
}
