/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { promises } from "fs";

import { NodeLocalFileSystem } from "@itwin/imodels-client-authoring/lib/base/internal";

export class TestLocalFileSystem extends NodeLocalFileSystem {
  public async isDirectory(path: string): Promise<boolean> {
    const fileStats = await promises.stat(path);
    return fileStats.isDirectory();
  }

  public async directoryExists(directory: string): Promise<boolean> {
    return this.pathIsAccessible(directory);
  }

  public async deleteDirectory(directory: string): Promise<void> {
    return promises.rmdir(directory);
  }
}

export const testLocalFileSystem = new TestLocalFileSystem();
