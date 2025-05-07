/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateIModelOperationDetailsResponse,
  OperationsBase,
} from "../../base/internal";
import { CreateIModelOperationDetails } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetCreateIModelOperationDetailsParams } from "./OperationParams";

export class OperationOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  constructor(options: TOptions) {
    super(options);
  }

  /**
   * Returns the information about iModel creation process. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-create-imodel-operation-details/ Get Create iModel Operation Details}
   * operation from iModels API.
   * @param {GetCreateIModelOperationDetailsParams} params parameters for this operation. See {@link GetCreateIModelOperationDetailsParams}.
   * @returns {Promise<CreateIModelOperationDetails>} iModel creation details. See {@link CreateIModelOperationDetails}.
   */
  public async getCreateIModelDetails(
    params: GetCreateIModelOperationDetailsParams
  ): Promise<CreateIModelOperationDetails> {
    const response =
      await this.sendGetRequest<CreateIModelOperationDetailsResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getCreateIModelOperationDetailsUrl({
          iModelId: params.iModelId,
        }),
        headers: params.headers,
      });
    return response.body.createOperation;
  }
}
