/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsApiUrlFormatter as ManamegentIModelsApiUrlFormatter } from "@itwin/imodels-client-management";
import { GetLockListUrlParams } from "./lock/LockOperationParams";

export class IModelsApiUrlFormatter extends ManamegentIModelsApiUrlFormatter {
  public getBaselineUrl(params: { iModelId: string }): string {
    return `${this.baseUri}/${params.iModelId}/baselinefile`;
  }

  public getLockListUrl(params: { iModelId: string, urlParams?: GetLockListUrlParams }): string {
    return `${this.baseUri}/${params.iModelId}/locks${this.formQueryString({ ...params.urlParams })}`;
  }
}
