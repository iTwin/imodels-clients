/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import { AnonymousCredential, BlobDownloadOptions, BlobGetPropertiesResponse, BlockBlobClient, BlockBlobParallelUploadOptions } from "@azure/storage-blob";
import { FileHandler, ProgressCallback } from "./FileHandler";

type AzureProgressData = { loadedBytes: number; };
type AzureProgressCallback = (progress: AzureProgressData) => void;

export class AzureSdkFileHandler implements FileHandler {
  public async uploadFile(uploadUrl: string, sourceFilePath: string, progressCallback?: ProgressCallback): Promise<void> {
    if (this.isUrlExpired(uploadUrl))
      throw new Error("AzureSdkFileHandler: cannot upload file because SAS url is expired.");

    const blockBlobClient = new BlockBlobClient(uploadUrl, new AnonymousCredential());

    let uploadOptions: BlockBlobParallelUploadOptions | undefined = undefined;
    if (progressCallback) {
      const fileSize = this.getFileSize(sourceFilePath);
      uploadOptions = {
        onProgress: this.transformProgressCallback(progressCallback, fileSize)
      }
    }

    await blockBlobClient.uploadFile(sourceFilePath, uploadOptions);
  }

  public async downloadFile(downloadUrl: string, targetFilePath: string, progressCallback?: ProgressCallback): Promise<void> {
    if (this.isUrlExpired(downloadUrl))
      throw new Error("AzureSdkFileHandler: cannot download file because SAS url is expired.");

    const blockBlobClient = new BlockBlobClient(downloadUrl, new AnonymousCredential());

    let downloadOptions: BlobDownloadOptions | undefined = undefined;
    if (progressCallback) {
      const blobProperties: BlobGetPropertiesResponse = await blockBlobClient.getProperties();
      const fileSize = blobProperties.contentLength!;
      downloadOptions = {
        onProgress: this.transformProgressCallback(progressCallback, fileSize)
      }
    }

    await blockBlobClient.downloadToFile(targetFilePath, undefined, undefined, downloadOptions);
  }

  public exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  public getFileSize(filePath: string): number {
    return fs.statSync(filePath).size;
  }

  public unlink(filePath: string): void {
    return fs.unlinkSync(filePath);
  }

  public createDirectory(directoryPath: string): void {
    if (fs.existsSync(directoryPath))
      return;

    const parentDirectory = path.dirname(directoryPath);
    this.createDirectory(parentDirectory);
    fs.mkdirSync(directoryPath);
  }

  public join(...paths: string[]): string {
    return path.join(...paths);
  }

  private isUrlExpired(url: string): boolean {
    const signedExpiryUrlParam = new URL(url).searchParams.get("se");
    if (!signedExpiryUrlParam)
      return false;

    const expiryUtc = new Date(signedExpiryUrlParam);
    const currentUtc = new Date(new Date().toUTCString());
    return expiryUtc <= currentUtc;
  }

  private transformProgressCallback(progressCallback: ProgressCallback, fileSize: number): AzureProgressCallback {
    return (progressData: AzureProgressData) => progressCallback({ bytesTotal: fileSize, bytesDownloaded: progressData.loadedBytes });
  }
}
