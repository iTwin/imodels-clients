/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import { AnonymousCredential, BlobDownloadOptions, BlobGetPropertiesResponse, BlockBlobClient, BlockBlobParallelUploadOptions } from "@azure/storage-blob";
import { DownloadFileParams, FileHandler, ProgressCallback, UploadFileParams } from "./FileHandler";

interface AzureProgressCallbackData {
  loadedBytes: number;
}

type AzureProgressCallback = (progress: AzureProgressCallbackData) => void;

/**
 * Default implementation for {@link FileHandler} interface that uses Azure SDK for file transfer operations and
 * Node.js `fs` module for local file storage operations.
 */
export class AzureSdkFileHandler implements FileHandler {
  public async uploadFile(params: UploadFileParams): Promise<void> {
    if (this.isUrlExpired(params.uploadUrl))
      throw new Error("AzureSdkFileHandler: cannot upload file because SAS url is expired.");

    const blockBlobClient = new BlockBlobClient(params.uploadUrl, new AnonymousCredential());

    let uploadOptions: BlockBlobParallelUploadOptions | undefined;
    if (params.progressCallback) {
      const fileSize = await this.getFileSize(params.sourceFilePath);
      uploadOptions = {
        onProgress: this.adaptProgressCallback(params.progressCallback, fileSize)
      };
    }

    await blockBlobClient.uploadFile(params.sourceFilePath, uploadOptions);
  }

  public async downloadFile(params: DownloadFileParams): Promise<void> {
    if (this.isUrlExpired(params.downloadUrl))
      throw new Error("AzureSdkFileHandler: cannot download file because SAS url is expired.");

    const blockBlobClient = new BlockBlobClient(params.downloadUrl, new AnonymousCredential());

    let downloadOptions: BlobDownloadOptions | undefined;
    if (params.progressCallback) {
      const blobProperties: BlobGetPropertiesResponse = await blockBlobClient.getProperties();
      const fileSize = blobProperties.contentLength!;
      downloadOptions = {
        onProgress: this.adaptProgressCallback(params.progressCallback, fileSize)
      };
    }

    await blockBlobClient.downloadToFile(params.targetFilePath, undefined, undefined, downloadOptions);
  }

  public async exists(filePath: string): Promise<boolean> {
    return fs.existsSync(filePath);
  }

  public async getFileSize(filePath: string): Promise<number> {
    return fs.statSync(filePath).size;
  }

  public async unlink(filePath: string): Promise<void> {
    return fs.unlinkSync(filePath);
  }

  public async createDirectory(directoryPath: string): Promise<void> {
    if (fs.existsSync(directoryPath))
      return;

    const parentDirectory = path.dirname(directoryPath);
    await this.createDirectory(parentDirectory);
    fs.mkdirSync(directoryPath);
  }

  public async join(...paths: string[]): Promise<string> {
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

  private adaptProgressCallback(progressCallback: ProgressCallback, fileSize: number): AzureProgressCallback {
    return (progressData: AzureProgressCallbackData) => progressCallback({ bytesTotal: fileSize, bytesTransferred: progressData.loadedBytes });
  }
}
