/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetExtendedDataResponse } from "@itwin/imodels-client-management/lib/base/internal";
import { ChangesetExtendedDataOperations as ManagementChangesetExtendedDataOperations } from "@itwin/imodels-client-management/lib/operations";

import { ChangesetExtendedData } from "@itwin/imodels-client-management";

import { OperationOptions } from "../OperationOptions";

import { ChangesetExtendedDataPropertiesForCreate, CreateChangesetExtendedDataParams } from "./ChangesetExtendedDataOperationsParams";

export class ChangesetExtendedDataOperations<TOptions extends OperationOptions> extends ManagementChangesetExtendedDataOperations<TOptions> {
  /**
  * Creates Changeset Extended Data. Wraps the
  * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel-changeset-extended-data/ Create Changeset Extended Data}
  * operation from iModels API.
  * @param {CreateChangesetExtendedDataParams} params parameters for this operation. See {@link CreateChangesetExtendedDataParams}.
  * @returns {Promise<ChangesetExtendedData>} newly created Changeset Extended Data. See {@link ChangesetExtendedData}.
  */
  public async create(params: CreateChangesetExtendedDataParams): Promise<ChangesetExtendedData> {
    const { authorization, iModelId, headers, changesetExtendedDataProperties, ...changesetIdOrIndex } = params;
    const createChangesetExtendedDataBody = this.getCreateChangesetExtendedDataRequestBody(changesetExtendedDataProperties);
    const createChangesetExtendedDataResponse = await this.sendPostRequest<ChangesetExtendedDataResponse>({
      authorization,
      url: this._options.urlFormatter.getSingleChangesetExtendedDataUrl({ iModelId, ...changesetIdOrIndex}),
      body: createChangesetExtendedDataBody,
      headers
    });

    return this.convertToChangesetExtendedData(createChangesetExtendedDataResponse.body.extendedData);
  }

  private getCreateChangesetExtendedDataRequestBody(changesetExtendedDataProperties: ChangesetExtendedDataPropertiesForCreate): object {
    const dataJson = JSON.stringify(changesetExtendedDataProperties.data);
    const data = Buffer.from(dataJson).toString("base64");
    return { data };
  }
}
