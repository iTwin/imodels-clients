import { ProjectsClient } from "./ProjectsClient";
import { Config } from "./Config";

export class TestProjectProvider {
  private static _projectId: string;
  private static _projectsClient = new ProjectsClient();

  public static async getProjectId(): Promise<string> {
    return TestProjectProvider._projectId ?? await TestProjectProvider.initializeAndGetProjectId();
  }

  private static async initializeAndGetProjectId(): Promise<string> {
    TestProjectProvider._projectId = await TestProjectProvider._projectsClient.getProjectIdByName(Config.get().testProjectName);
    return TestProjectProvider._projectId;
  }
}
