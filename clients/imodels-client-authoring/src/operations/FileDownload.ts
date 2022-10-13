/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";

import { IModelsErrorImpl } from "@itwin/imodels-client-management/lib/base/internal";
import { ClientStorage } from "@itwin/object-storage-core";

import { IModelsErrorCode } from "@itwin/imodels-client-management";

import { GenericAbortSignal } from "../base/types";

/** Function for reporting progress of the download. */
export type DownloadCallback = (bytesDownloaded: number) => void;

/** Parameters for downloading single file. */
export interface DownloadFileParams {
  /** Storage client for downloading file. */
  storage: ClientStorage;
  /** URL of the file in the storage. */
  url: string;
  /** Absolute file path. */
  localPath: string;
  /** Function periodically called to report how many bytes of the file are downloaded. */
  fileDownloadCallback?: DownloadCallback;
  /** Function periodically called to report how many bytes were downloaded since the last time this function was called. */
  chunkDownloadCallback?: DownloadCallback;
  /** Abort signal for cancelling file download. */
  abortSignal?: GenericAbortSignal;
}

/** Downloads file to path from provided storage. */
export async function downloadFile(params: DownloadFileParams): Promise<void> {
  const targetFileStream = fs.createWriteStream(params.localPath);

  try {
    const downloadStream = await params.storage.download({
      ...params,
      transferType: "stream"
    });
    downloadStream.pipe(targetFileStream);

    if (params.fileDownloadCallback || params.chunkDownloadCallback){
      let bytesDownloaded = 0;
      downloadStream.on("data", (chunk: any) => {
        bytesDownloaded += chunk?.length;
        params.fileDownloadCallback?.(bytesDownloaded);
        params.chunkDownloadCallback?.(chunk?.length);
      });
    }

    await new Promise((resolve, reject) => {
      downloadStream.on("error", reject);
      targetFileStream.on("close", resolve);
    });
  } catch (error: unknown) {
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
