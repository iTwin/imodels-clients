/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { constants, promises } from "fs";
import { LocalFileSystem } from "./LocalFileSystem";

export class LocalFileSystemImpl implements LocalFileSystem {
  public async createDirectory(directory: string): Promise<void> {
    await promises.mkdir(directory, { recursive: true });
  }

  public async getFileSize(filePath: string): Promise<number> {
    const fileStats = await promises.stat(filePath)
    return fileStats.size;
  }

  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await promises.access(filePath, constants.F_OK); // TODO: test
      return true
    } catch {
      return false;
    }
  }

  public deleteFile(filePath: string): Promise<void> {
    return promises.unlink(filePath);
  }
}
