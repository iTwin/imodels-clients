/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { BlockBlobClient, AnonymousCredential } from "@azure/storage-blob";
import { FileHandler } from "./FileHandler";

export class AzureSdkFileHandler implements FileHandler {
  async uploadFile(uploadUrl: string, sourcePath: string): Promise<void> {
    const blockBlobClient = new BlockBlobClient(uploadUrl, new AnonymousCredential());
    await blockBlobClient.uploadFile(sourcePath);
  }

  getFileSize(filePath: string): number {
    return fs.statSync(filePath).size;
  }
}
