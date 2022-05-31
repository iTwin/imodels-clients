/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { ProjectsClient } from "./ProjectsClient";
import { TestProjectProviderConfig } from "./TestProjectProviderConfig";

@injectable()
export class TestProjectProvider {
  private _projectId: string | undefined;

  constructor(
    private readonly _testProjectProviderConfig: TestProjectProviderConfig,
    private readonly _projectsClient: ProjectsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider
  ) { }

  public async getOrCreate(): Promise<string> {
    return this._projectId ?? await this.initialize();
  }

  private async initialize(): Promise<string> {
    const authorization = this._testAuthorizationProvider.getAdmin1AuthorizationForProjects();
    this._projectId = await this._projectsClient.getOrCreateProject({
      authorization,
      projectName: this._testProjectProviderConfig.testProjectName
    });
    return this._projectId;
  }
}
