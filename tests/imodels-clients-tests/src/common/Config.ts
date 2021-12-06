/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as dotenv from "dotenv";
import { TestSetupError } from "./CommonTestUtils";

export interface AuthConfigValues {
  authority: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
}

export interface ApiConfigValues {
  baseUrl: string;
  version?: string;
  scopes: string;
}

export interface ApisConfigValues {
  projects: ApiConfigValues;
  iModels: ApiConfigValues;
}

export interface TestUserConfigValues {
  email: string;
  password: string;
}

export interface TestUsersConfigValues {
  admin1: TestUserConfigValues;
  admin2FullyFeatured: TestUserConfigValues;
}

export interface ConfigValues {
  testProjectName: string;
  testIModelName: string;
  auth: AuthConfigValues;
  apis: ApisConfigValues;
  testUsers: TestUsersConfigValues;
}

export class Config {
  private static _config: ConfigValues;

  public static get(): ConfigValues {
    return this._config ?? this.load();
  }

  private static load(): ConfigValues {
    dotenv.config();
    this.validateAllValuesPresent();

    return {
      testProjectName: process.env.TEST_PROJECT_NAME!,
      testIModelName: process.env.TEST_IMODEL_NAME!,
      auth: {
        authority: process.env.AUTH_AUTHORITY!,
        clientId: process.env.AUTH_CLIENT_ID!,
        clientSecret: process.env.AUTH_CLIENT_SECRET!,
        redirectUrl: process.env.AUTH_REDIRECT_URL!
      },
      apis: {
        iModels: {
          baseUrl: process.env.APIS_IMODELS_BASE_URL!,
          version: process.env.APIS_IMODELS_VERSION!,
          scopes: process.env.APIS_IMODELS_SCOPES!
        },
        projects: {
          baseUrl: process.env.APIS_PROJECTS_BASE_URL!,
          scopes: process.env.APIS_PROJECTS_SCOPES!
        }
      },
      testUsers: {
        admin1: {
          email: process.env.TEST_USERS_ADMIN1_EMAIL!,
          password: process.env.TEST_USERS_ADMIN1_PASSWORD!
        },
        admin2FullyFeatured: {
          email: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL!,
          password: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD!
        }
      }
    };
  }

  private static validateAllValuesPresent(): void {
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

  private static validateConfigValue(key: string): void {
    if (!process.env[key])
      throw new TestSetupError(`Invalid configuration: missing ${key} value.`);
  }
}
