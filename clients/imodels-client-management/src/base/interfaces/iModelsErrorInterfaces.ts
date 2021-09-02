/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export enum iModelsErrorCode {
  Unrecognized = "Unrecognized",

  Unknown = "Unknown",
  Unauthorized = "Unauthorized",

  InvalidiModelsRequest = "InvalidiModelsRequest",
  InvalidValue = "InvalidValue",
  iModelExists = "iModelExists",

  InitializationFailed = "InitializationFailed"
}

export interface iModelsError extends Error {
  code: iModelsErrorCode;
  details?: iModelsErrorDetail[];
}

export interface iModelsErrorDetail {
  code: iModelsErrorCode;
  message: string;
  target: string;
}
