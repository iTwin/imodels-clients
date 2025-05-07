/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";

import { testLocalFileSystem } from "./TestLocalFileSystem";

export class TestSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestSetupFailed";
  }
}

export function createDirectory(directoryPath: string): void {
  if (fs.existsSync(directoryPath)) return;

  const parentDirectory = path.dirname(directoryPath);
  createDirectory(parentDirectory);
  fs.mkdirSync(directoryPath);
}

export async function cleanupDirectory(directory: string): Promise<void> {
  if (!(await testLocalFileSystem.directoryExists(directory))) return;

  const directoryObjects = await fs.promises.readdir(directory);
  const fileDeletePromises: Promise<void>[] = directoryObjects.map(
    async (objectName) => {
      const fullPath = path.join(directory, objectName);

      const isDirectory = await testLocalFileSystem.isDirectory(fullPath);
      if (isDirectory) {
        await cleanupDirectory(fullPath);
        await testLocalFileSystem.deleteDirectory(fullPath);
      } else {
        await testLocalFileSystem.deleteFile(fullPath);
      }
    }
  );
  await Promise.all(fileDeletePromises);
}

export function createGuidValue(): string {
  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  // cspell:disable-next-line
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
