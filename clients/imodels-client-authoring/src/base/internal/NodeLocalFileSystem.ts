/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { constants, promises } from "fs";

import { LocalFileSystem } from "../types";

export class NodeLocalFileSystem implements LocalFileSystem {
  public async createDirectory(directory: string): Promise<void> {
    await promises.mkdir(directory, { recursive: true });
  }

  public async getFileSize(filePath: string): Promise<number> {
    const fileStats = await promises.stat(filePath);
    return fileStats.size;
  }

  public async fileExists(filePath: string): Promise<boolean> {
    return this.pathIsAccessible(filePath);
  }

  public async deleteFile(filePath: string): Promise<void> {
    return promises.unlink(filePath);
  }

  protected async pathIsAccessible(path: string): Promise<boolean> {
    try {
      await promises.access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
