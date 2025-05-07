/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as dotenv from "dotenv";
import { injectable } from "inversify";

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
  iTwins: ApiConfigValues;
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

export interface BehaviorOptions {
  /**
   * Instructs the test setup to delete the existing reusable iModel and create a new one. Used
   * in scenarios there are new features added to the API and we want to update the reusable iModel have more configured properties.
   */
  recreateReusableIModel: boolean;
}

@injectable()
export class IModelsClientsTestsConfig {
  public readonly testITwinName: string;
  public readonly testIModelName: string;
  public readonly auth: AuthConfigValues;
  public readonly apis: ApisConfigValues;
  public readonly testUsers: TestUsersConfigValues;
  public readonly behaviorOptions: BehaviorOptions;

  constructor(envFilePath: string) {
    dotenv.config({ path: envFilePath });
    this.validateAllValuesPresent();

    this.testITwinName = process.env.TEST_ITWIN_NAME!;
    this.testIModelName = process.env.TEST_IMODEL_NAME!;

    this.auth = {
      authority: process.env.AUTH_AUTHORITY!,
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      redirectUrl: process.env.AUTH_REDIRECT_URL!,
    };

    this.apis = {
      iModels: {
        baseUrl: process.env.APIS_IMODELS_BASE_URL!,
        version: process.env.APIS_IMODELS_VERSION!,
        scopes: process.env.APIS_IMODELS_SCOPES!,
      },
      iTwins: {
        baseUrl: process.env.APIS_ITWINS_BASE_URL!,
        scopes: process.env.APIS_ITWINS_SCOPES!,
      },
    };

    this.testUsers = {
      admin1: {
        email: process.env.TEST_USERS_ADMIN1_EMAIL!,
        password: process.env.TEST_USERS_ADMIN1_PASSWORD!,
      },
      admin2FullyFeatured: {
        email: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL!,
        password: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD!,
      },
    };

    this.behaviorOptions = {
      recreateReusableIModel:
        Number(process.env.TEST_BEHAVIOR_OPTIONS_RECREATE_IMODEL) > 0,
    };
  }

  private validateAllValuesPresent(): void {
    this.validateConfigValue("TEST_ITWIN_NAME");
    this.validateConfigValue("TEST_IMODEL_NAME");

    this.validateConfigValue("AUTH_AUTHORITY");
    this.validateConfigValue("AUTH_CLIENT_ID");
    this.validateConfigValue("AUTH_CLIENT_SECRET");
    this.validateConfigValue("AUTH_REDIRECT_URL");

    this.validateConfigValue("APIS_IMODELS_BASE_URL");
    this.validateConfigValue("APIS_IMODELS_VERSION");
    this.validateConfigValue("APIS_IMODELS_SCOPES");

    this.validateConfigValue("APIS_ITWINS_BASE_URL");
    this.validateConfigValue("APIS_ITWINS_SCOPES");

    this.validateConfigValue("TEST_USERS_ADMIN1_EMAIL");
    this.validateConfigValue("TEST_USERS_ADMIN1_PASSWORD");

    this.validateConfigValue("TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL");
    this.validateConfigValue("TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD");

    this.validateConfigOptionalNumericValue(
      "TEST_BEHAVIOR_OPTIONS_RECREATE_IMODEL"
    );
  }

  private validateConfigValue(key: string): void {
    if (!process.env[key])
      throw new TestSetupError(`Invalid configuration: missing ${key} value.`);
  }

  private validateConfigOptionalNumericValue(key: string): void {
    const value = process.env[key];
    if (value === undefined) return;

    if (isNaN(Number(value)))
      throw new TestSetupError(
        `Invalid configuration: ${key} value must be a number.`
      );
  }
}
