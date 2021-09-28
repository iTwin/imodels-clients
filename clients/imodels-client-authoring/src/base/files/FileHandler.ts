/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface FileHandler {
  uploadFile(uploadUrl: string, sourcePath: string): Promise<void>;
  downloadFile(downloadUrl: string, targetPath: string): Promise<void>;
  getFileSize(filePath: string): number;
  createDirectory(directory: string): void;
  join(...paths: string[]): string;
}
