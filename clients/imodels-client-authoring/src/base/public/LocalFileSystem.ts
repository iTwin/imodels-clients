/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * Abstraction for local file system. Used to access the local file system in operations that
 * involve file transfer, e.g. Changeset download.
 */
export interface LocalFileSystem {
  /**
   * Creates specified directory recursively.
   * @param {string} directoryPath directory to create.
   * @returns {Promise<void>}
   */
  createDirectory(directory: string): Promise<void>;

  /**
   * Determines size of the specified file.
   * @param {string} filePath path of the file.
   * @returns {Promise<number>} file size in bytes.
   */
  getFileSize(filePath: string): Promise<number>;

  /**
   * Determines if a file with the specified path exists in the file system.
   * @param {string} filePath path of the file.
   * @returns {Promise<boolean>} `true` if the file exists, `false` otherwise.
   */
  fileExists(filePath: string): Promise<boolean>;

  /**
   * Deletes the specified file.
   * @param {string} filePath path of the file.
   * @returns {Promise<void>}
   */
  deleteFile(filePath: string): Promise<void>;
}
