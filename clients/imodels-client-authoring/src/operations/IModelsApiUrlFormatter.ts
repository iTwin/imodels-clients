/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsApiUrlFormatter as ManamegentIModelsApiUrlFormatter } from "@itwin/imodels-client-management";

export class IModelsApiUrlFormatter extends ManamegentIModelsApiUrlFormatter {
  public getBaselineUrl(params: { iModelId: string }): string {
    return `${this.baseUrl}/${params.iModelId}/baselinefile`;
  }
}
