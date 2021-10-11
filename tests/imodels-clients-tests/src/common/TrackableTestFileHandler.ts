/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { FileHandler } from "@itwin/imodels-client-authoring";

export class FileTransferLog {
  public downloads: { [key: string]: number; } = {};

  public recordDownload(downloadUrl: string): void {
    if (this.downloads[downloadUrl] === undefined)
      this.downloads[downloadUrl] = 0;

    this.downloads[downloadUrl]++;
  }
}

export class TrackableTestFileHandler implements FileHandler {
  constructor(
    private _underlyingHandler: FileHandler,
    private _stubs?: {
      downloadStub?: (downloadUrl: string, targetFilePath: string) => Promise<void>
    }) {
  }

  uploadFile(uploadUrl: string, sourcePath: string): Promise<void> {
    return this._underlyingHandler.uploadFile(uploadUrl, sourcePath);
  }

  downloadFile(downloadUrl: string, targetPath: string): Promise<void> {
    if (this._stubs?.downloadStub)
      return this._stubs?.downloadStub(downloadUrl, targetPath);

    return this._underlyingHandler.downloadFile(downloadUrl, targetPath);
  }

  exists(filePath: string): boolean {
    return this._underlyingHandler.exists(filePath);
  }

  getFileSize(filePath: string): number {
    return this._underlyingHandler.getFileSize(filePath);
  }

  unlink(filePath: string): void {
    this._underlyingHandler.unlink(filePath);
  }

  createDirectory(directoryPath: string): void {
    return this._underlyingHandler.createDirectory(directoryPath);
  }

  join(...paths: string[]): string {
    return this._underlyingHandler.join(...paths);
  }
}
