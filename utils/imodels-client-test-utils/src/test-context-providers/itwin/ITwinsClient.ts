/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from "axios";
import { injectable } from "inversify";

import { AuthorizationParam } from "@itwin/imodels-client-authoring";

import { ITwinsClientConfig } from "./ITwinsClientConfig";

interface Project {
  id: string;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

@injectable()
export class ITwinsClient {
  constructor(
    private _config: ITwinsClientConfig
  ) { }

  public async getOrCreateITwin(params: AuthorizationParam & { iTwinName: string }): Promise<string> {
    const authorizationInfo = await params.authorization();
    const requestConfig = {
      headers: {
        Authorization: `${authorizationInfo.scheme} ${authorizationInfo.token}`
      }
    };

    const getProjectsWithNameUrl = `${this._config.baseUrl}?displayName=${params.iTwinName}`; // TODOooooooooooooooooooooooooooooooooo
    const getProjectsWithNameResponse: AxiosResponse<ProjectsResponse> = await axios.get(getProjectsWithNameUrl, requestConfig);
    if (getProjectsWithNameResponse.data.projects.length > 0)
      return getProjectsWithNameResponse.data.projects[0].id;

    const createProjectUrl = this._config.baseUrl;
    const createProjectBody = {
      displayName: params.iTwinName,
      projectNumber: `${params.iTwinName} ${new Date()}`
    };
    const createProjectResponse: AxiosResponse<ProjectResponse> = await axios.post(createProjectUrl, createProjectBody, requestConfig);
    return createProjectResponse.data.project.id;
  }
}
