/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsApiUrlFormatter as ManamegentiModelsApiUrlFormatter } from "@itwin/imodels-client-management";
import { GetLockListUrlParams } from "./lock/LockOperationParams";

export class iModelsApiUrlFormatter extends ManamegentiModelsApiUrlFormatter {
  public getBaselineUrl(params: { imodelId: string }): string {
    return `${this.baseUri}/${params.imodelId}/baselinefile`;
  }

  public getLockListUrl(params: { imodelId: string, urlParams?: GetLockListUrlParams }): string {
    return `${this.baseUri}/${params.imodelId}/locks${this.formQueryString({ ...params.urlParams })}`;
  }
}
