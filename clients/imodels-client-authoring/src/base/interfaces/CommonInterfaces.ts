/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

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
