/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "@itwin/imodels-client-management";
import { BaselineFile, BaselineFileResponse } from "../../base/interfaces/apiEntities/BaselineFileInterfaces";
import { GetBaselineFileByiModelIdParams } from "./BaselineFileOperationParams";

export class BaselineFileOperations extends OperationsBase {
  public async getByiModelId(params: GetBaselineFileByiModelIdParams): Promise<BaselineFile> {
    const response = await this.sendGetRequest<BaselineFileResponse>({
      ...params,
      url: `${this._apiBaseUrl}/${params.imodelId}/baselineFile`
    });
    return response.baselineFile;
  }
}
