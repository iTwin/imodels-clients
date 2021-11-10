/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface ProgressData {
  bytesDownloaded: number;
  bytesTotal: number;
}

export type ProgressCallback = (progressData: ProgressData) => void;

export interface UploadFileParams {
  uploadUrl: string;
  sourceFilePath: string;
  progressCallback?: ProgressCallback;
}

export interface DownloadFileParams {
  downloadUrl: string;
  targetFilePath: string;
  progressCallback?: ProgressCallback;
}

export interface FileHandler {
  uploadFile(params: UploadFileParams): Promise<void>;
  downloadFile(params: DownloadFileParams): Promise<void>;
  exists(filePath: string): boolean;
  getFileSize(filePath: string): number;
  unlink(filePath: string): void;
  createDirectory(directoryPath: string): void;
  join(...paths: string[]): string;
}
