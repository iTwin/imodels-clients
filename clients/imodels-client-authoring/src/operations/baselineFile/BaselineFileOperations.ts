/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "@itwin/imodels-client-management";
import { BaselineFile, BaselineFileResponse } from "../../base/interfaces/apiEntities/BaselineFileInterfaces";
import { OperationOptions } from "../OperationOptions";
import { GetSingleBaselineFileParams } from "./BaselineFileOperationParams";

export class BaselineFileOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public async getSingle(params: GetSingleBaselineFileParams): Promise<BaselineFile> {
    const response = await this.sendGetRequest<BaselineFileResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBaselineUrl({ iModelId: params.iModelId })
    });
    return response.baselineFile;
  }
}
