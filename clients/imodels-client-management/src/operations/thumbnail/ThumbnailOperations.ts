/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from "axios";
import { OperationsBase, Thumbnail, ThumbnailSize } from "../../base";
import { Constants } from "../../Constants";
// import { Constants } from "../../Constants";
import { OperationOptions } from "../OperationOptions";
import { DownloadThumbnailParams, UploadThumbnailParams } from "./ThumbnailOperationParams";

export class ThumbnailOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {

  public async download(params: DownloadThumbnailParams): Promise<Thumbnail> {
    const url = this._options.urlFormatter.getThumbnailUrl({ iModelId: params.iModelId, urlParams: params.urlParams });
    const requestHeaders = await this.formHeaders({
      authorization: params.authorization
    });

    const response: AxiosResponse = await axios.get(url, {
      headers: requestHeaders,
      responseType: "arraybuffer" // TODO: we should not reference the client directly as users can supply their own
    });

    // By default iModels API returns a small thumbnail.
    const thumbnailSize = params.urlParams?.size ?? ThumbnailSize.Small;
    return {
      size: thumbnailSize,
      data: response.data as Uint8Array
    };
  }

  public async upload(params: UploadThumbnailParams): Promise<void> {
    const url = this._options.urlFormatter.getThumbnailUrl({ iModelId: params.iModelId });
    const requestHeaders = await this.formHeaders({
      authorization: params.authorization
    });
    requestHeaders[Constants.headers.contentType] = params.thumbnailProperties.imageType;


    await axios.put(url, params.thumbnailProperties.data, {
      headers: requestHeaders,
    });

  }
}