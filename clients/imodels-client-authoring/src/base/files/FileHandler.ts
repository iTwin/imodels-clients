/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export enum FileTransferStatus {
  Success = 0,
  IntermittentFailure = 1,
  Failure = 2
}

export interface FileTransferResult {
  status: FileTransferStatus;
  data?: unknown;
}

export interface FileHandler {
  uploadFile(uploadUrl: string, sourcePath: string): Promise<void>;
  downloadFile(downloadUrl: string, targetPath: string): Promise<FileTransferResult>;
  getFileSize(filePath: string): number;
  createDirectory(directory: string): void;
  join(...paths: string[]): string;
}
