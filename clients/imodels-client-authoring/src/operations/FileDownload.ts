/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "reflect-metadata";
import * as fs from "fs";

import { IModelsErrorImpl } from "@itwin/imodels-client-management";
import { ClientStorage } from "@itwin/object-storage-core";

import { IModelsErrorCode } from "@itwin/imodels-client-management";

import { GenericAbortSignal } from "../base/types/index.js";

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
  totalDownloadCallback?: DownloadCallback;
  /** Function called to report how many bytes were downloaded with the latest chunk. */
  latestDownloadedChunkSizeCallback?: DownloadCallback;
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

    if (params.totalDownloadCallback || params.latestDownloadedChunkSizeCallback){
      let bytesDownloaded = 0;
      downloadStream.on("data", (chunk: any) => {
        bytesDownloaded += chunk?.length;
        params.totalDownloadCallback?.(bytesDownloaded);
        params.latestDownloadedChunkSizeCallback?.(chunk?.length);
      });
    }

    await new Promise<void>((resolve, reject) => {
      downloadStream.on("error", reject);
      targetFileStream.on("close", () => resolve());
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
    message: `Download was aborted. Message: ${error.message}}.`,
    originalError: error,
    statusCode: undefined,
    details: undefined
  });
}
