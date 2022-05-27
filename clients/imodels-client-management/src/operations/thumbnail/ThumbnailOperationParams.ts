/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelScopedOperationParams, SupportedBinaryTypes, ThumbnailSize } from "../../base";

/** Url parameters supported in Thumbnail download operation. */
export interface DownloadThumbnailUrlParams {
  /** Thumbnail size. See {@link ThumbnailSize}.  */
  size?: ThumbnailSize;
}

/** Parameters for download Thumbnail operation. */
export interface DownloadThumbnailParams extends IModelScopedOperationParams {
  urlParams?: DownloadThumbnailUrlParams;
}

/** Properties that should be specified when uploading a Thumbnail. */
export interface ThumbnailPropertiesForUpload {
  /**
   * Type of the image described by standard `Content-Type` header values. Specify `ContentType.Png` when uploading a
   * .png image and `ContentType.Jpeg` when uploading a .jpeg image.
   */
  imageType: SupportedBinaryTypes;
  /** Binary image data. */
  image: Uint8Array;
}

/** Parameters for upload Thumbnail operation. */
export interface UploadThumbnailParams extends IModelScopedOperationParams {
  /** Properties of the new Thumbnail. See {@link ThumbnailPropertiesForUpload}. */
  thumbnailProperties: ThumbnailPropertiesForUpload;
}
