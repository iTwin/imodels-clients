/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from "axios";
import { AuthorizationParam } from "@itwin/imodels-client-management";
import { Config } from "../../Config";

interface Project {
  id: string;
}

interface ProjectsResponse {
  projects: Project[]
}

interface ProjectResponse {
  project: Project;
}

export class ProjectsClient {
  public async getOrCreateProject(params: AuthorizationParam & { projectName: string }): Promise<string> {
    const autorizationInfo = await params.authorization();
    const requestConfig = {
      headers: {
        Authorization: `${autorizationInfo.scheme} ${autorizationInfo.token}`
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
