/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AxiosRestClient, BaseEntity, RequestContextParams, RestClient } from "@itwin/imodels-client-management";
import { TestSetupError } from "./CommonTestUtils";
import { Config } from "./Config";

interface ProjectsResponse {
  projects: BaseEntity[]
}

interface ProjectResponse {
  project: BaseEntity;
}

export class ProjectsClient {
  private _restClient: RestClient;

  constructor() {
    const parseErrorFunc = (response: {
      statusCode: number,
      body: unknown
    }) => new TestSetupError(`Projects request failed with status code ${response?.statusCode}: ${JSON.stringify(response?.body)}`);

    this._restClient = new AxiosRestClient(parseErrorFunc);
  }

  public async getProjectIdByName(params: RequestContextParams & { projectName: string }): Promise<string> {
    const headers = {
      Authorization: `${params.requestContext.authorization.scheme} ${params.requestContext.authorization.token}`
    };

    const getProjectsWithNameResponse = await this._restClient.sendGetRequest<ProjectsResponse>({
      url: `${Config.get().apis.projects.baseUrl}?displayName=${params.projectName}`,
      headers
    });

    if (getProjectsWithNameResponse.projects.length > 0)
      return getProjectsWithNameResponse.projects[0].id;

    const createProjectResponse = await this._restClient.sendPostRequest<ProjectResponse>({
      url: Config.get().apis.projects.baseUrl,
      headers,
      body: {
        displayName: params.projectName,
        projectNumber: `${params.projectName} ${new Date()}`
      }
    });
    return createProjectResponse.project.id;
  }
}
