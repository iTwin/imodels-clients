/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the iTwin root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from "axios";
import { injectable } from "inversify";

import { AuthorizationParam } from "@itwin/imodels-client-authoring";

import { ITwinsClientConfig } from "./ITwinsClientConfig";

interface iTwin {
  id: string;
}

interface ITwinsResponse {
  iTwins: iTwin[];
}

interface ITwinResponse {
  iTwin: iTwin;
}

@injectable()
export class ITwinsClient {
  private readonly defaultClass = "Endeavor";
  private readonly defaultSubClass = "Project";
  constructor(
    private _config: ITwinsClientConfig
  ) { }

  public async getOrCreateITwin(params: AuthorizationParam & { iTwinName: string }): Promise<string> {
    const authorizationInfo = await params.authorization();
    const requestConfig = {
      headers: {
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
        Authorization: `${authorizationInfo.scheme} ${authorizationInfo.token}`
      }
    };

    const getITwinsWithNameUrl = `${this._config.baseUrl}?subClass=${this.defaultSubClass}&displayName=${params.iTwinName}`;
    const getITwinsWithNameResponse: AxiosResponse<ITwinsResponse> = await axios.get(getITwinsWithNameUrl, requestConfig);
    if (getITwinsWithNameResponse.data.iTwins.length > 0)
      return getITwinsWithNameResponse.data.iTwins[0].id;

    const createITwinUrl = this._config.baseUrl;
    const createITwinBody = {
      class: this.defaultClass,
      subClass: this.defaultSubClass,
      displayName: params.iTwinName
    };
    const createITwinResponse: AxiosResponse<ITwinResponse> = await axios.post(createITwinUrl, createITwinBody, requestConfig);
    return createITwinResponse.data.iTwin.id;
  }
}
