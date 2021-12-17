/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as dotenv from "dotenv";
import { injectable } from "inversify";
import { ApisConfigValues, AuthConfigValues, BaseIntegrationTestsConfig, TestSetupError, TestUsersConfigValues } from "@itwin/imodels-client-test-utils";

@injectable()
export class IModelsAccessBackendTestsConfig implements BaseIntegrationTestsConfig {
  public readonly testProjectName: string;
  public readonly testIModelName: string;
  public readonly auth: AuthConfigValues;
  public readonly apis: ApisConfigValues;
  public readonly testUsers: TestUsersConfigValues;

  constructor() {
    dotenv.config();
    this.validateAllValuesPresent();

    this.testProjectName = process.env.TEST_PROJECT_NAME!;
    this.testIModelName = process.env.TEST_IMODEL_NAME!;

    this.auth = {
      authority: process.env.AUTH_AUTHORITY!,
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      redirectUrl: process.env.AUTH_REDIRECT_URL!
    };

    this.apis = {
      iModels: {
        baseUrl: process.env.APIS_IMODELS_BASE_URL!,
        version: process.env.APIS_IMODELS_VERSION!,
        scopes: process.env.APIS_IMODELS_SCOPES!
      },
      projects: {
        baseUrl: process.env.APIS_PROJECTS_BASE_URL!,
        scopes: process.env.APIS_PROJECTS_SCOPES!
      }
    };

    this.testUsers = {
      admin1: {
        email: process.env.TEST_USERS_ADMIN1_EMAIL!,
        password: process.env.TEST_USERS_ADMIN1_PASSWORD!
      },
      admin2FullyFeatured: {
        email: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL!,
        password: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD!
      }
    };
  }

  private validateAllValuesPresent(): void {
    this.validateConfigValue("TEST_PROJECT_NAME");
    this.validateConfigValue("TEST_IMODEL_NAME");

    this.validateConfigValue("AUTH_AUTHORITY");
    this.validateConfigValue("AUTH_CLIENT_ID");
    this.validateConfigValue("AUTH_CLIENT_SECRET");
    this.validateConfigValue("AUTH_REDIRECT_URL");

    this.validateConfigValue("APIS_IMODELS_BASE_URL");
    this.validateConfigValue("APIS_IMODELS_VERSION");
    this.validateConfigValue("APIS_IMODELS_SCOPES");

    this.validateConfigValue("APIS_PROJECTS_BASE_URL");
    this.validateConfigValue("APIS_PROJECTS_SCOPES");

    this.validateConfigValue("TEST_USERS_ADMIN1_EMAIL");
    this.validateConfigValue("TEST_USERS_ADMIN1_PASSWORD");

    this.validateConfigValue("TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL");
    this.validateConfigValue("TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD");
  }

  private validateConfigValue(key: string): void {
    if (!process.env[key])
      throw new TestSetupError(`Invalid configuration: missing ${key} value.`);
  }
}
