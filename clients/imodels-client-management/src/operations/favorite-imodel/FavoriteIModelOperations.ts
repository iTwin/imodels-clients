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
  AddIModelToFavoritesParams,
  GetFavoriteIModelListParams,
  RemoveIModelFromFavoritesParams,
} from "./FavoriteIModelOperationParams";

export class FavoriteIModelOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Gets favorite iModels for a specific iTwin. This method returns iModels in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/get-my-favorite-imodels/ Get My Favorite iTwin iModels}
   * operation from iModels API.
   * @param {GetFavoriteIModelListParams} params parameters for this operation. See {@link GetFavoriteIModelListParams}.
   * @returns {EntityListIterator<MinimalIModel>} iterator for favorite iModel list. See {@link EntityListIterator}, {@link MinimalIModel}.
   */
  public getMinimalList(
    params: GetFavoriteIModelListParams
  ): EntityListIterator<MinimalIModel> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalIModel,
        IModelsResponse<MinimalIModel>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getFavoriteIModelListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor: (response) => response.body.iModels,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets favorite iModels for a specific iTwin. This method returns iModels in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/get-my-favorite-imodels/ Get My Favorite iTwin iModels}
   * operation from iModels API.
   * @param {GetFavoriteIModelListParams} params parameters for this operation. See {@link GetFavoriteIModelListParams}.
   * @returns {EntityListIterator<IModel>} iterator for favorite iModel list. See {@link EntityListIterator}, {@link IModel}.
   */
  public getRepresentationList(
    params: GetFavoriteIModelListParams
  ): EntityListIterator<IModel> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<IModel, IModelsResponse<IModel>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getFavoriteIModelListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor: (response) => response.body.iModels,
        headers: params.headers,
      })
    );
  }

  /**
   * Adds an iModel to the calling user's favorites list. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/add-imodel-to-my-favorites/ Add iModel to My Favorites}
   * operation from iModels API.
   * @param {AddIModelToFavoritesParams} params parameters for this operation. See {@link AddIModelToFavoritesParams}.
   * @returns {Promise<void>}
   */
  public async add(params: AddIModelToFavoritesParams): Promise<void> {
    await this.sendPutRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getFavoriteIModelUrl({
        iModelId: params.iModelId,
      }),
      headers: params.headers,
      body: new Uint8Array(),
    });
  }

  /**
   * Removes an iModel from the calling user's favorites list. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/remove-imodel-from-my-favorites/ Remove iModel from My Favorites}
   * operation from iModels API.
   * @param {RemoveIModelFromFavoritesParams} params parameters for this operation. See {@link RemoveIModelFromFavoritesParams}.
   * @returns {Promise<void>}
   */
  public async remove(params: RemoveIModelFromFavoritesParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getFavoriteIModelUrl({
        iModelId: params.iModelId,
      }),
      headers: params.headers,
    });
  }
}
