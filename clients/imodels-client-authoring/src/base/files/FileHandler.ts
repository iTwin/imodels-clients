/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface FileHandler {
  uploadFile(uploadUrl: string, sourceFilePath: string): Promise<void>;
  downloadFile(downloadUrl: string, targetFilePath: string): Promise<void>;
  exists(filePath: string): boolean;
  getFileSize(filePath: string): number;
  unlink(filePath: string): void;
  createDirectory(directoryPath: string): void;
  join(...paths: string[]): string;
}
