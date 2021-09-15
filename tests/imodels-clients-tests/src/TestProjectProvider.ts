import { BaseEntity, RestClient, AxiosRestClient, RequestContext } from "@itwin/imodels-client-management";
import { Config } from "./Config";
import { TestAuthClient } from "./TestAuthClient";

interface ProjectsResponse {
  projects: BaseEntity[]
}

interface CreateProjectResponse {
  project: BaseEntity;
}

class ProjectsClient {
  private _restClient: RestClient;

  constructor() {
    const defaultParseErrorFunc = (response: {
      statusCode: number;
      body: unknown;
    }) => new Error(`Projects request failed with status code ${response?.statusCode}: ${JSON.stringify(response?.body)}`);

    this._restClient = new AxiosRestClient(defaultParseErrorFunc);
  }

  public async getProjectIdByName(projectName: string): Promise<string> {
    const requestContext = await this.getRequestContext();
    const headers = {
      Authorization: `${requestContext.authorization.scheme} ${requestContext.authorization.token}`
    };

    const getProjectsWithNameResponse = await this._restClient.sendGetRequest<ProjectsResponse>({
      url: `${Config.get().apis.projects.baseUrl}?displayName=${projectName}`,
      headers
    });

    if (getProjectsWithNameResponse.projects.length > 0)
      return getProjectsWithNameResponse.projects[0].id;

    const createProjectResponse = await this._restClient.sendPostRequest<CreateProjectResponse>({
      url: Config.get().apis.projects.baseUrl,
      headers,
      body: {
        displayName: projectName,
        projectNumber: `${projectName} #${this.getUniqueProjectNumber()}`
      }
    });
    return createProjectResponse.project.id;
  }

  private getUniqueProjectNumber(): string {
    return (new Date()).getTime().toString(36);
  }

  private async getRequestContext(): Promise<RequestContext> {
    const authClient = new TestAuthClient({
      authority: Config.get().auth.authority,
      clientId: Config.get().auth.clientId,
      clientSecret: Config.get().auth.clientSecret,
      scopes: Config.get().apis.projects.scopes,
      redirectUrl: Config.get().auth.redirectUrl
    });
    return {
      authorization: {
        scheme: "Bearer",
        token: await authClient.getAccessToken({
          email: Config.get().testUser.email,
          password: Config.get().testUser.password
        })
      }
    };
  }
}

export class TestProjectProvider {
  private static _projectId: string;
  private static _projectsClient = new ProjectsClient();

  public static async getProjectId(): Promise<string> {
    return TestProjectProvider._projectId ?? await TestProjectProvider.initializeAndGetProjectId();
  }

  private static async initializeAndGetProjectId(): Promise<string> {
    TestProjectProvider._projectId = await TestProjectProvider._projectsClient.getProjectIdByName(Config.get().defaultProjectName);
    return TestProjectProvider._projectId;
  }
}

