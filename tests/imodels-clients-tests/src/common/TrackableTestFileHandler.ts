/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { DownloadFileParams, FileHandler, UploadFileParams } from "@itwin/imodels-client-authoring";

export class FileTransferLog {
  public downloads: { [key: string]: number } = {};

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
      downloadStub?: (params: DownloadFileParams) => Promise<void>;
    }) {
  }

  public async uploadFile(params: UploadFileParams): Promise<void> {
    return this._underlyingHandler.uploadFile(params);
  }

  public async downloadFile(params: DownloadFileParams): Promise<void> {
    if (this._stubs?.downloadStub)
      return this._stubs?.downloadStub(params);

    return this._underlyingHandler.downloadFile(params);
  }

  public exists(filePath: string): boolean {
    return this._underlyingHandler.exists(filePath);
  }

  public getFileSize(filePath: string): number {
    return this._underlyingHandler.getFileSize(filePath);
  }

  public unlink(filePath: string): void {
    this._underlyingHandler.unlink(filePath);
  }

  public createDirectory(directoryPath: string): void {
    return this._underlyingHandler.createDirectory(directoryPath);
  }

  public  join(...paths: string[]): string {
    return this._underlyingHandler.join(...paths);
  }
}
