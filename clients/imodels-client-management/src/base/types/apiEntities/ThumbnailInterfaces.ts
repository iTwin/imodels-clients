/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ContentType } from "../RestClient";

/** Thumbnail size. */
export enum ThumbnailSize {
  /** A small Thumbnail is a 400x250 PNG image. */
  Small = "small",
  /** A large Thumbnail is a 800x500 PNG image. */
  Large = "large",
}

/** Full representation of a iModel Thumbnail. */
export interface Thumbnail {
  /** Thumbnail size. See {@link ThumbnailSize}. */
  size: ThumbnailSize;
  /**
   * Type of the image. All Thumbnails queried from iModels API are .png images regardless of
   * the original uploaded file type.
   */
  imageType: ContentType.Png;
  /** Binary image data. */
  image: Uint8Array;
}
