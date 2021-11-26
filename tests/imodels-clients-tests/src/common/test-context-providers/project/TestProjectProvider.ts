/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config } from "../../Config";
import { TestAuthenticationClient } from "../auth/TestAuthenticationClient";
import { ProjectsClient } from "./ProjectsClient";

export class TestProjectProvider {
  private static _projectId: string;
  private static readonly _projectsClient = new ProjectsClient();
  private static readonly _projectsApiAuthClient = new TestAuthenticationClient({
    ...Config.get().auth,
    scopes: Config.get().apis.projects.scopes
  });

  public static async getProjectId(): Promise<string> {
    return TestProjectProvider._projectId ?? await TestProjectProvider.initializeAndGetProjectId();
  }

  private static async initializeAndGetProjectId(): Promise<string> {
    const accessToken = await this._projectsApiAuthClient.getAccessToken(Config.get().testUsers.admin1);
    TestProjectProvider._projectId = await TestProjectProvider._projectsClient.getOrCreateProject({
      authorization: async () => ({ scheme: "Bearer", token: accessToken }),
      projectName: Config.get().testProjectName
    });
    return TestProjectProvider._projectId;
  }
}
