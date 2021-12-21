/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
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

export interface BaseIntegrationTestsConfig {
  testProjectName: string;
  testIModelName: string;
  auth: AuthConfigValues;
  apis: ApisConfigValues;
  testUsers: TestUsersConfigValues;
}
