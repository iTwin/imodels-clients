/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsApiUrlFormatter as ManamegentiModelsApiUrlFormatter } from "@itwin/imodels-client-management";
import { GetLockListUrlParams } from "./lock/LockOperationParams";

interface iModelId {
  imodelId: string;
}

interface UrlParams<TParams> {
  urlParams?: TParams;
}

export class iModelsApiUrlFormatter extends ManamegentiModelsApiUrlFormatter {
  public getBaselineUrl(params: iModelId): string {
    return `${this.baseUri}/${params.imodelId}/baselineFile`;
  }

  public getLocksUrl(params: iModelId & UrlParams<GetLockListUrlParams>): string {
    return `${this.baseUri}/${params.imodelId}/locks${this.formQueryString({ ...params.urlParams })}`;
  }

  public getLockUrl(params: iModelId): string {
    return `${this.baseUri}/${params.imodelId}/locks`;
  }
}
