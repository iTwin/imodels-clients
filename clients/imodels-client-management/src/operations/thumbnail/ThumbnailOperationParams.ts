/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelScopedOperationParams, ThumbnailSize } from "../../IModelsClientExports";

export interface DownloadThumbnailUrlParams {
  size?: ThumbnailSize;
}

export interface DownloadThumbnailParams extends IModelScopedOperationParams {
  urlParams?: DownloadThumbnailUrlParams;
}

export enum ImageType {
  Png = "image/png",
  Jpeg = "image/jpeg"
}

export interface ThumbnailPropertiesForUpload {
  imageType: ImageType;
  data: Uint8Array;
}

export interface UploadThumbnailParams extends IModelScopedOperationParams {
  thumbnailProperties: ThumbnailPropertiesForUpload;
}