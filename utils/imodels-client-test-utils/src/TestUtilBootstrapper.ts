/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Container } from "inversify";
import { IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { ProjectsClient, ProjectsClientConfig, ReusableTestIModelProvider, ReusableTestIModelProviderConfig, TestAuthorizationClient, TestAuthorizationClientConfig, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelRetriever, TestIModelsClient, TestIModelsClientOptions, TestProjectProvider, TestProjectProviderConfig } from "./test-context-providers";
import { TestAuthorizationProviderConfig } from "./test-context-providers/auth/TestAuthorizationProviderConfig";
import { TestIModelGroupFactory } from "./test-imodel-group/TestIModelGroupFactory";
import { TestUtilTypes } from "./TestUtilTypes";
import { IModelsClientsTestsConfig } from "./IModelsClientsTestsConfig";

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

    container.bind(ProjectsClientConfig).toSelf().inSingletonScope();
    container.bind(ProjectsClient).toSelf().inSingletonScope();
    container.bind(TestProjectProviderConfig).toSelf().inSingletonScope();
    container.bind(TestProjectProvider).toSelf().inSingletonScope();

    container.bind<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions).to(TestIModelsClientOptions).inSingletonScope();
    container.bind(TestIModelsClient).toSelf().inSingletonScope();
    container.bind(ReusableTestIModelProviderConfig).toSelf().inSingletonScope();
    container.bind(ReusableTestIModelProvider).toSelf().inSingletonScope();
    container.bind(TestIModelCreator).toSelf().inSingletonScope();
    container.bind(TestIModelFileProvider).toSelf().inSingletonScope();
    container.bind(TestIModelRetriever).toSelf().inSingletonScope();
  }
}
