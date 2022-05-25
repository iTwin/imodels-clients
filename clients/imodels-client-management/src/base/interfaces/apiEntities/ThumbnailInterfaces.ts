/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Thumbnail size. */
export enum ThumbnailSize {
  /** A small Thumbnail is a 400x250 PNG image. */
  Small = "small",
  /** A large thumbnail is a 800x500 PNG image. */
  Large = "large"
}

export interface Thumbnail { // TODO: add content type?
  size: ThumbnailSize;
  data: Uint8Array;
}