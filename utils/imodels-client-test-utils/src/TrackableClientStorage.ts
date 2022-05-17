/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Readable } from "stream";
import { ClientStorage, ConfigDownloadInput, ConfigUploadInput, TransferData, UploadInMultiplePartsInput, UrlDownloadInput, UrlUploadInput } from "@itwin/object-storage-core";

export class FileTransferLog {
  public downloads: { [key: string]: number } = {};

  public recordDownload(downloadUrl: string): void {
    if (this.downloads[downloadUrl] === undefined)
      this.downloads[downloadUrl] = 0;

    this.downloads[downloadUrl]++;
  }
}

export class TrackableClientStorage implements ClientStorage {
  constructor(
    private _underlyingStorage: ClientStorage,
    private _interceptors?: {
      download?: (input: UrlDownloadInput | ConfigDownloadInput) => void;
    }) {
  }
  public download(input: (UrlDownloadInput | ConfigDownloadInput) & {
    transferType: "buffer";
  }): Promise<Buffer>;
  public download(input: (UrlDownloadInput | ConfigDownloadInput) & {
    transferType: "stream";
  }): Promise<Readable>;
  public download(input: (UrlDownloadInput | ConfigDownloadInput) & {
    transferType: "local";
    localPath: string;
  }): Promise<string>;
  public async download(
    input: UrlDownloadInput | ConfigDownloadInput
  ): Promise<TransferData> {
    if (this._interceptors?.download)
      this._interceptors.download(input);

    return this._underlyingStorage.download(input as any);
  }

  public async upload(
    input: UrlUploadInput | ConfigUploadInput
  ): Promise<void> {
    return this._underlyingStorage.upload(input);

  }

  public async uploadInMultipleParts(
    input: UploadInMultiplePartsInput
  ): Promise<void> {
    return this._underlyingStorage.uploadInMultipleParts(input);
  }
}
