import { inject, injectable } from "inversify";
import { BaseIntegrationTestsConfig, TestUsersConfigValues } from "../../BaseIntegrationTestsConfig";
import { TestUtilTypes } from "../../TestUtilTypes";

interface ApiScopes {
  iModels: string;
  projects: string;
}

@injectable()
export class TestAuthorizationProviderConfig {
  public testUsers: TestUsersConfigValues;
  public apiScopes: ApiScopes;

  constructor(
    @inject(TestUtilTypes.BaseIntegrationTestsConfig)
    config: BaseIntegrationTestsConfig
  ) {
    this.testUsers = config.testUsers;
    this.apiScopes = {
      iModels: config.apis.iModels.scopes,
      projects: config.apis.projects.scopes
    };
  }
}
