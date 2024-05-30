/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetExtendedDataListResponse, ChangesetExtendedDataResponse, ChangesetExtendedDataServer, EntityListIteratorImpl, OperationsBase } from "../../base/internal";
import { ChangesetExtendedData, EntityListIterator, HttpResponse } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetChangesetExtendedDataListParams, GetSingleChangesetExtendedDataParams } from "./ChangesetExtendedDataOperationParams";

export class ChangesetExtendedDataOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions
  ) {
    super(options);

    if (!this._options.useExperimental)
      throw new Error("This operation is experimental and requires the useExperimental flag to be set to true in the client options.");
  }
  /**
   * Gets Changesets Extended Data for a specific iModel. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changesets-extended-data/ Get iModel Changesets Extended Data}
   * operation from iModels API.
   * @param {GetChangesetExtendedDataListParams} params parameters for this operation. See {@link GetChangesetExtendedDataListParams}.
   * @returns {EntityListIterator<ChangesetExtendedData>} iterator for Changeset Extended Data list. See {@link EntityListIterator}.
   * @alpha
   */
  public getList(params: GetChangesetExtendedDataListParams): EntityListIterator<ChangesetExtendedData> {
    const entityCollectionAccessor = (response: HttpResponse<ChangesetExtendedDataListResponse>) => {
      const changesetExtendedDataServer = response.body.extendedData;
      const mappedChangesetExtendedData = changesetExtendedDataServer.map((extendedData) => this.convertToChangesetExtendedData(extendedData));
      return mappedChangesetExtendedData;
    };
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<ChangesetExtendedData, ChangesetExtendedDataListResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getChangesetExtendedDataListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      entityCollectionAccessor,
      headers: params.headers
    }));
  }

  /**
   * Gets a single Changeset Extended Data identified by either Changeset index or id. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changeset-extended-data-details/ Get iModel Changeset Extended Data}
   * operation from iModels API.
   * @param {GetSingleChangesetExtendedDataParams} params parameters for this operation. See {@link GetSingleChangesetExtendedDataParams}.
   * @returns {Promise<ChangesetExtendedData>} a Changeset Extended Data with the specified changeset id or index. See {@link ChangesetExtendedData}.
   * @alpha
   */
  public async getSingle(params: GetSingleChangesetExtendedDataParams): Promise<ChangesetExtendedData> {
    const { authorization, iModelId, headers, ...changesetIdOrIndex } = params;
    const response = await this.sendGetRequest<ChangesetExtendedDataResponse>({
      authorization,
      url: this._options.urlFormatter.getSingleChangesetExtendedDataUrl({ iModelId, ...changesetIdOrIndex }),
      headers
    });

    return this.convertToChangesetExtendedData(response.body.extendedData);
  }

  protected convertToChangesetExtendedData(changesetExtendedDataServer: ChangesetExtendedDataServer): ChangesetExtendedData {
    return {
      changesetId: changesetExtendedDataServer.changesetId,
      changesetIndex: changesetExtendedDataServer.changesetIndex,
      data: this.convertBase64StringToJSON(changesetExtendedDataServer.data)
    };
  }

  private convertBase64StringToJSON(input: string): object {
    const decodedString = Buffer.from(input, "base64").toString("utf8");
    return JSON.parse(decodedString);
  }
}
