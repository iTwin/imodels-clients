/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { ClientStorage } from "@itwin/object-storage-core";
import { FileDownloadCallback, GenericAbortSignal } from "../base/types";
import { IModelsErrorImpl } from "@itwin/imodels-client-management/lib/base/internal";
import { IModelsErrorCode } from "@itwin/imodels-client-management";

/** Parameters used to download file. */
export interface DownloadFileParams {
  /** Client storage used to download file. */
  storage: ClientStorage,
  /** URL of the file in storage. */
  url: string;
  /** Absolute path of the file. */
  localPath: string;
  /** Function called to report file download progress. */
  downloadCallback?: FileDownloadCallback;
  /** Abort signal used to cancel file download. */
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

  throw new IModelsErrorImpl({
    code: IModelsErrorCode.DownloadAborted,
    message: `Download was aborted. Message: ${error.message}}.`
  });
}
