/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export enum FileTransferStatus {
  Success = 0,
  IntermittentFailure = 1,
  Failure = 2
}

export interface FileHandler {
  uploadFile(uploadUrl: string, sourcePath: string): Promise<FileTransferStatus>;
  downloadFile(downloadUrl: string, targetPath: string): Promise<FileTransferStatus>;
  getFileSize(filePath: string): number;
  createDirectory(directory: string): void;
  join(...paths: string[]): string;
}
