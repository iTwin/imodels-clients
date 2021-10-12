/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config } from "./Config";
import { ProjectsClient } from "./ProjectsClient";
import { TestAuthenticationClient } from "./TestAuthenticationClient";

export class TestProjectProvider {
  private static _projectId: string;
  private static _projectsClient = new ProjectsClient();
  private static _projectsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.projects.scopes
  });

  public static async getProjectId(): Promise<string> {
    return TestProjectProvider._projectId ?? await TestProjectProvider.initializeAndGetProjectId();
  }

  private static async initializeAndGetProjectId(): Promise<string> {
    TestProjectProvider._projectId = await TestProjectProvider._projectsClient.getOrCreateProject({
      requestContext: {
        authorization: {
          scheme: "Bearer",
          token: await this._projectsApiAuthClient.getAccessToken(Config.get().testUsers.user1)
        }
      },
      projectName: Config.get().testProjectName
    });
    return TestProjectProvider._projectId;
  }
}
