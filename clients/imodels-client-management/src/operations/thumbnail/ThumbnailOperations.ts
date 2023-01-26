/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/internal";
import { ContentType, Thumbnail, ThumbnailSize } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { DownloadThumbnailParams, UploadThumbnailParams } from "./ThumbnailOperationParams";

export class ThumbnailOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Downloads a thumbnail for a specific iModel. The Thumbnail returned is either a default one or a custom
   * uploaded one. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-thumbnail/ Download iModel Thumbnail}
   * operation from iModels API.
   * @param {DownloadThumbnailParams} params parameters for this operation. See {@link DownloadThumbnailParams}.
   * @returns {Promise<Thumbnail>} downloaded Thumbnail. See {@link Thumbnail}. The method returns the data in binary
   * form which can then be consumed depending on the environment.
   * @example
   * Save data to local file (Node.js):
   * ```
   *  const thumbnail: Thumbnail = await iModelsClient.thumbnails.download({ ... });
   *  await fs.promises.writeFile("thumbnail.png", Buffer.from(thumbnail.data.buffer), "binary");
   * ```
   */
  public async download(params: DownloadThumbnailParams): Promise<Thumbnail> {
    // By default iModels API returns a small thumbnail. We specify the size explicitly to be able
    // to return to user the information which thumbnail is this.
    const urlParams = {
      ...params.urlParams,
      size: params.urlParams?.size ?? ThumbnailSize.Small
    };
    const url = this._options.urlFormatter.getThumbnailUrl({ iModelId: params.iModelId, urlParams });
    const response: Uint8Array = await this.sendGetRequest({
      authorization: params.authorization,
      url,
      responseType: ContentType.Png
    });

    return {
      size: urlParams.size,
      imageType: ContentType.Png,
      image: response
    };
  }

  /**
   * Uploads a custom iModel Thumbnail. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/upload-imodel-thumbnail/ Upload iModel Thumbnail}
   * operation from iModels API.
   * @param {UploadThumbnailParams} params parameters for this operation. See {@link UploadThumbnailParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async upload(params: UploadThumbnailParams): Promise<void> {
    const url = this._options.urlFormatter.getThumbnailUrl({ iModelId: params.iModelId });
    await this.sendPutRequest({
      authorization: params.authorization,
      url,
      contentType: params.thumbnailProperties.imageType,
      body: params.thumbnailProperties.image
    });
  }
}
