/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from "axios";
import { RequestContextParams } from "@itwin/imodels-client-management";
import { Config } from "./Config";

interface MinimalProject {
  id: string;
  displayName: string;
}

interface ProjectsResponse {
  projects: MinimalProject[]
}

interface ProjectResponse {
  project: MinimalProject;
}

export class ProjectsClient {
  public async getOrCreateProject(params: RequestContextParams & { projectName: string }): Promise<string> {
    const requestConfig = {
      headers: {
        Authorization: `${params.requestContext.authorization.scheme} ${params.requestContext.authorization.token}`
      }
    };

    const getProjectsWithNameUrl = `${Config.get().apis.projects.baseUrl}?displayName=${params.projectName}`;
    const getProjectsWithNameResponse: AxiosResponse<ProjectsResponse> = await axios.get(getProjectsWithNameUrl, requestConfig);
    if (getProjectsWithNameResponse.data.projects.length > 0)
      return getProjectsWithNameResponse.data.projects[0].id;

    const createProjectUrl = Config.get().apis.projects.baseUrl;
    const createProjectBody = {
      displayName: params.projectName,
      projectNumber: `${params.projectName} ${new Date()}`
    };
    const createProjectResponse: AxiosResponse<ProjectResponse> = await axios.post(createProjectUrl, createProjectBody, requestConfig);
    return createProjectResponse.data.project.id;
  }
}
