/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "reflect-metadata";

import { GenericAbortSignal as ObjectStorageAbortSignal } from "@itwin/object-storage-core";

/** Common properties of all downloaded files. */
export interface DownloadedFileProps {
  /** Absolute path of the downloaded file. */
  filePath: string;
}

/** Common parameters for all download operations. */
export interface TargetDirectoryParam {
  /** Absolute path of the target directory. If directory does not exist the file download operation creates it. */
  targetDirectoryPath: string;
}

/** Signal interface for signalling abort. */
export type GenericAbortSignal = ObjectStorageAbortSignal;

/** Function for reporting progress of the download. */
export type ProgressCallback = (downloaded: number, total: number) => void;

/** Common parameters for progress reporting download operations. */
export interface DownloadProgressParam {
  /** 
   * Function called to report download progress.
   * IMPORTANT: This function should never throw an error or cancel the download, otherwise it may result in unexpected behavior.
   */
  progressCallback?: ProgressCallback;
  /** Abort signal for cancelling download. */
  abortSignal?: GenericAbortSignal;
}
