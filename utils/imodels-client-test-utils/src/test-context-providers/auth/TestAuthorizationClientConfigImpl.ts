import { injectable } from "inversify";

import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig";

@injectable()
export class TestAuthorizationClientConfig {
  public authority: string;
  public clientId: string;
  public clientSecret: string;
  public redirectUrl: string;

  constructor(config: IModelsClientsTestsConfig) {
    this.authority = config.auth.authority;
    this.clientId = config.auth.clientId;
    this.clientSecret = config.auth.clientSecret;
    this.redirectUrl = config.auth.redirectUrl;
  }
}
