/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "@itwin/imodels-client-management/lib/base/internal";

import { BaselineFileResponse } from "../../base/internal";
import { BaselineFile } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetSingleBaselineFileParams } from "./BaselineFileOperationParams";

export class BaselineFileOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets a single Baseline file by iModel id. This method returns a Baseline file in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-baseline-file-details/
   * Get iModel Baseline File Details} operation from iModels API.
   * @param {GetSingleBaselineFileParams} params parameters for this operation. See {@link GetSingleBaselineFileParams}.
   * @returns {Promise<BaselineFile>} a Baseline file for the specified iModel. See {@link BaselineFile}.
   */
  public async getSingle(params: GetSingleBaselineFileParams): Promise<BaselineFile> {
    const response = await this.sendGetRequest<BaselineFileResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBaselineUrl({ iModelId: params.iModelId })
    });
    return response.baselineFile;
  }
}
