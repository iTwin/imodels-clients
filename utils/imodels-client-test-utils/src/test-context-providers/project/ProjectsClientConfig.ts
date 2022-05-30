/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";
import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig";

@injectable()
export class ProjectsClientConfig {
  public baseUrl: string;

  constructor(
    config: IModelsClientsTestsConfig
  ) {
    this.baseUrl = config.apis.projects.baseUrl;
  }
}
