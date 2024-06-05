/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetExtendedDataApiResponse, ChangesetExtendedDataListResponse, ChangesetExtendedDataResponse, EntityListIteratorImpl, OperationsBase } from "../../base/internal";
import { ChangesetExtendedData, EntityListIterator, HttpResponse } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetChangesetExtendedDataListParams, GetSingleChangesetExtendedDataParams } from "./ChangesetExtendedDataOperationParams";

export class ChangesetExtendedDataOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions
  ) {
    super(options);
  }

  /**
   * Gets Changesets Extended Data for a specific iModel. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-changesets-extended-data/ Get iModel Changesets Extended Data}
   * operation from iModels API.
   * @param {GetChangesetExtendedDataListParams} params parameters for this operation. See {@link GetChangesetExtendedDataListParams}.
   * @returns {EntityListIterator<ChangesetExtendedData>} iterator for Changeset Extended Data list. See {@link EntityListIterator}.
   */
  public getList(params: GetChangesetExtendedDataListParams): EntityListIterator<ChangesetExtendedData> {
    const entityCollectionAccessor = (response: HttpResponse<ChangesetExtendedDataListResponse>) => {
      const apiResponse = response.body.extendedData;
      const mappedChangesetExtendedData = apiResponse.map((extendedData) => this.convertToChangesetExtendedData(extendedData));
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

  protected convertToChangesetExtendedData(changesetExtendedDataApiResponse: ChangesetExtendedDataApiResponse): ChangesetExtendedData {
    return {
      changesetId: changesetExtendedDataApiResponse.changesetId,
      changesetIndex: changesetExtendedDataApiResponse.changesetIndex,
      data: this.convertBase64StringToJSON(changesetExtendedDataApiResponse.data)
    };
  }

  private convertBase64StringToJSON(input: string): object {
    if (typeof window !== "undefined") {
      const binString = atob(input);
      const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } else {
      const decodedString = Buffer.from(input, "base64").toString("utf8");
      return JSON.parse(decodedString);
    }
  }
}
