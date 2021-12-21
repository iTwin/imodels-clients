import { inject, injectable } from "inversify";
import { BaseIntegrationTestsConfig } from "../../BaseIntegrationTestsConfig";
import { TestUtilTypes } from "../../TestUtilTypes";

@injectable()
export class TestAuthorizationClientConfig {
  public authority: string;
  public clientId: string;
  public clientSecret: string;
  public redirectUrl: string;

  constructor(
    @inject(TestUtilTypes.BaseIntegrationTestsConfig)
    config: BaseIntegrationTestsConfig
  ) {
    this.authority = config.auth.authority;
    this.clientId = config.auth.clientId;
    this.clientSecret = config.auth.clientSecret;
    this.redirectUrl = config.auth.redirectUrl;
  }
}
