/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsApiUrlFormatter as ManamegentiModelsApiUrlFormatter } from "@itwin/imodels-client-management";

interface iModelId {
  imodelId: string;
}

export class iModelsApiUrlFormatter extends ManamegentiModelsApiUrlFormatter {
  public getBaselineUrl(params: iModelId): string {
    return `${this.baseUri}/${params.imodelId}/baselineFile`;
  }
}
