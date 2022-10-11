/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";

import { IModelsErrorImpl } from "@itwin/imodels-client-management/lib/base/internal";
import { ClientStorage } from "@itwin/object-storage-core";

import { IModelsErrorCode } from "@itwin/imodels-client-management";

import { FileDownloadCallback, GenericAbortSignal } from "../base/types";

/** Parameters for downloading single file. */
export interface DownloadFileParams {
  /** Storage client for downloading file. */
  storage: ClientStorage;
  /** URL of the file in the storage. */
  url: string;
  /** Absolute file path. */
  localPath: string;
  /** Function called to report progress of the download. */
  downloadCallback?: FileDownloadCallback;
  /** Abort signal for cancelling file download. */
  abortSignal?: GenericAbortSignal;
}

/** Downloads file to path from provided storage. */
export async function downloadFile(params: DownloadFileParams) {
  const targetFileStream = fs.createWriteStream(params.localPath);

  try {
    const downloadStream = await params.storage.download({
      ...params,
      transferType: "stream"
    });
    downloadStream.pipe(targetFileStream);

    if (params.downloadCallback){
      let bytesDownloaded = 0;
      downloadStream.on("data", (chunk: any) => {
        bytesDownloaded += chunk?.length;
        params.downloadCallback?.(bytesDownloaded);
      });
    }

    await new Promise((resolve, reject) => {
      downloadStream.on("error", reject);
      targetFileStream.on("close", resolve);
    });
  } catch (error: unknown) {
    params.downloadCallback?.(0);
    targetFileStream.end();
    throw adaptAbortError(error);
  }
}

function adaptAbortError(error: unknown): unknown {
  if (!(error instanceof Error) || error.name !== "AbortError")
    return error;

  return new IModelsErrorImpl({
    code: IModelsErrorCode.DownloadAborted,
    message: `Download was aborted. Message: ${error.message}}.`
  });
}
