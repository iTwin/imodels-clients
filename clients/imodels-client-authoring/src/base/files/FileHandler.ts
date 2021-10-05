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
  uploadFile(uploadUrl: string, sourceFilePath: string): Promise<FileTransferStatus>;
  downloadFile(downloadUrl: string, targetFilePath: string): Promise<FileTransferStatus>;
  exists(filePath: string): boolean;
  getFileSize(filePath: string): number;
  unlink(filePath: string): void;
  createDirectory(directoryPath: string): void;
  join(...paths: string[]): string;
}
