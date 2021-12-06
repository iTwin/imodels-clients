/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

export class Constants {
  public static TestDownloadDirectoryPath = path.join(__dirname, "../testDownloads");
  public static PackagePrefix = "IModelsClientsTests";
  public static TestDeviceName = "Test device";
}
