/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Data reported on each file transfer iteration. */
export interface ProgressData {
  /** Bytes that have been transferred. */
  bytesTransferred: number;
  /** Total size in bytes of the file being transferred. */
  bytesTotal: number;
}

/** Function to call to report file transfer progress. */
export type ProgressCallback = (progressData: ProgressData) => void;

/** Parameters for upload file operation. */
export interface UploadFileParams {
  /** Remote storage url where to upload the file. */
  uploadUrl: string;
  /** Path to the local file to be uploaded. */
  sourceFilePath: string;
  /** Function to be called to report progress on each transfer iteration. See {@link ProgressCallback}. */
  progressCallback?: ProgressCallback;
}

/** Parameters for download file operation. */
export interface DownloadFileParams {
  /** Remote storage url from where to download the file. */
  downloadUrl: string;
  /** Path to the local file to download to. */
  targetFilePath: string;
  /** Function to be called to report progress on each transfer iteration. See {@link ProgressCallback}. */
  progressCallback?: ProgressCallback;
}

/**
 * Handler for file system operations. It contains methods used by operations that transfer
 * files, for example, Changeset download.
 */
export interface FileHandler {
  /**
   * Uploads file from the local source to the remote target and reports progress via the user-passed progress callback.
   * @param {UploadFileParams} params parameters for this operation. See {@link UploadFileParams}.
   * @returns a promise that resolves after operation completes.
   */
  uploadFile(params: UploadFileParams): Promise<void>;

  /**
   * Downloads file from the remote target to the local source and reports progress via the user-passed progress callback.
   * @param {DownloadFileParams} params parameters for this operation. See {@link DownloadFileParams}.
   * @returns a promise that resolves after operation completes.
   */
  downloadFile(params: DownloadFileParams): Promise<void>;

  /**
   * Determines if a file with the specified path exists in the file system.
   * @param {string} filePath path of the file.
   * @returns `true` if the file exists, `false` otherwise.
   */
  exists(filePath: string): boolean;

  /**
   * Determines size of the specified file.
   * @param {string} filePath path of the file.
   * @returns file size in bytes.
   */
  getFileSize(filePath: string): number;

  /**
   * Deletes the specified file.
   * @param {string} filePath path of the file.
   */
  unlink(filePath: string): void;

  /**
   * Creates specified directory recursively.
   * @param {string} directoryPath directory to create.
   */
  createDirectory(directoryPath: string): void;

  /**
   * Joins all path segments together into a normalized path.
   * @param {string[]} paths path segments to join.
   * @returns normalized path.
   */
  join(...paths: string[]): string;
}
