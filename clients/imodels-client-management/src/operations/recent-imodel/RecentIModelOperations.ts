/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EntityListIteratorImpl,
  IModelsResponse,
  OperationsBase,
} from "../../base/internal";
import {
  EntityListIterator,
  IModel,
  MinimalIModel,
  PreferReturn,
} from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import {
  AddIModelToRecentsParams,
  GetRecentIModelListParams,
  RemoveIModelFromRecentsParams,
} from "./RecentIModelOperationParams";

export class RecentIModelOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Gets recently used iModels for a specific iTwin. A user can only have 25 recently used iModels.
   * They are returned in order with the most recently used iModel first in the list. This method returns iModels in their minimal representation.
   * The returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-my-recently-used-imodels/ Get My Recently Used iTwin iModels}
   * operation from iModels API.
   * @param {GetRecentIModelListParams} params parameters for this operation. See {@link GetRecentIModelListParams}.
   * @returns {EntityListIterator<MinimalIModel>} iterator for recent iModel list. See {@link EntityListIterator}, {@link MinimalIModel}.
   */
  public getMinimalList(
    params: GetRecentIModelListParams
  ): EntityListIterator<MinimalIModel> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalIModel,
        IModelsResponse<MinimalIModel>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getRecentIModelListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor: (response) => response.body.iModels,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets recently used iModels for a specific iTwin. A user can only have 25 recently used iModels.
   * They are returned in order with the most recently used iModel first in the list. This method returns iModels in their full representation.
   * The returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-my-recently-used-imodels/ Get My Recently Used iTwin iModels}
   * operation from iModels API.
   * @param {GetRecentIModelListParams} params parameters for this operation. See {@link GetRecentIModelListParams}.
   * @returns {EntityListIterator<IModel>} iterator for recent iModel list. See {@link EntityListIterator}, {@link IModel}.
   */
  public getRepresentationList(
    params: GetRecentIModelListParams
  ): EntityListIterator<IModel> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<IModel, IModelsResponse<IModel>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getRecentIModelListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor: (response) => response.body.iModels,
        headers: params.headers,
      })
    );
  }

  /**
   * Adds an iModel to the calling user's recently used iModels list. No more than 25 iModels are
   * stored in the recently used list. Older ones are removed to make room for new ones. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/add-imodel-to-my-recents/ Add iModel to My Recents}
   * operation from iModels API.
   * @param {AddIModelToRecentsParams} params parameters for this operation. See {@link AddIModelToRecentsParams}.
   * @returns {Promise<void>}
   */
  public async add(params: AddIModelToRecentsParams): Promise<void> {
    await this.sendPostRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getRecentIModelUrl({
        iModelId: params.iModelId,
      }),
      headers: params.headers,
      body: undefined,
    });
  }

  /**
   * Removes an iModel from the calling user's recents list. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/remove-imodel-from-my-recents/ Remove iModel from My Recents}
   * operation from iModels API.
   * @param {RemoveIModelFromRecentsParams} params parameters for this operation. See {@link RemoveIModelFromRecentsParams}.
   * @returns {Promise<void>}
   */
  public async remove(params: RemoveIModelFromRecentsParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getRecentIModelUrl({
        iModelId: params.iModelId,
      }),
      headers: params.headers,
    });
  }
}
