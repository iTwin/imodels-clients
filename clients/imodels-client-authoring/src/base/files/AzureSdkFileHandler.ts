/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { AnonymousCredential, BlockBlobClient } from "@azure/storage-blob";
import { FileHandler } from "./FileHandler";

export class AzureSdkFileHandler implements FileHandler {
  public async uploadFile(uploadUrl: string, sourcePath: string): Promise<void> {
    const blockBlobClient = new BlockBlobClient(uploadUrl, new AnonymousCredential());
    await blockBlobClient.uploadFile(sourcePath);
  }

  public async downloadFile(downloadUrl: string, targetPath: string): Promise<void> {
    const blockBlobClient = new BlockBlobClient(downloadUrl, new AnonymousCredential());
    await blockBlobClient.downloadToFile(targetPath);
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
}
