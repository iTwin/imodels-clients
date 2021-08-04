/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface APIEntity {
  id: string;
  displayName: string;
}

export interface Link {
  href: string;
}

export interface RequestContextParam {
  requestContext: {
    accessToken: string;
  };
}

export interface CollectionRequestParams {
  $skip?: number;
  $top?: number;
}

export enum iModelsErrorCode {
  Unrecognized = "Unrecognized",

  Unknown = "Unknown",
  Unauthorized = "Unauthorized",
  InvalidiModelsRequest = "InvalidiModelsRequest",
  InvalidValue = "InvalidValue"
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
