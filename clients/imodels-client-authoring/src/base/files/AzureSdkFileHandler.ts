/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { AnonymousCredential, BlockBlobClient } from "@azure/storage-blob";
import { FileHandler, FileTransferStatus } from "./FileHandler";
import { URL } from "url";

export class AzureSdkFileHandler implements FileHandler {
  public async uploadFile(uploadUrl: string, sourcePath: string): Promise<FileTransferStatus> {
    if (this.isUrlExpired(uploadUrl))
      return FileTransferStatus.IntermittentFailure;

    const blockBlobClient = new BlockBlobClient(uploadUrl, new AnonymousCredential());
    await blockBlobClient.uploadFile(sourcePath);
    return FileTransferStatus.Success;
  }

  public async downloadFile(downloadUrl: string, targetPath: string): Promise<FileTransferStatus> {
    if (this.isUrlExpired(downloadUrl))
      return FileTransferStatus.IntermittentFailure;

    const blockBlobClient = new BlockBlobClient(downloadUrl, new AnonymousCredential());
    await blockBlobClient.downloadToFile(targetPath);
    return FileTransferStatus.Success;
  }

  public getFileSize(filePath: string): number {
    return fs.statSync(filePath).size;
  }

  public createDirectory(directory: string): void {
    if (fs.existsSync(directory))
      return;

    const parentDirectory = path.dirname(directory);
    this.createDirectory(parentDirectory);
    fs.mkdirSync(directory);
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
}
