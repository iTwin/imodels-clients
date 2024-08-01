/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsError, IModelsErrorCode, IModelsErrorDetail, IModelsOriginalError } from "../types";

export interface UnwrappedError {
  message: string;
}

export interface IModelsApiErrorWrapper {
  error: IModelsApiError;
}

export interface IModelsApiError {
  code: string;
  statusCode?: number;
  message?: string;
  details?: IModelsApiErrorDetail[];
}

export interface IModelsApiErrorDetail {
  code: string;
  message: string;
  target: string;
}

export class IModelsErrorBaseImpl extends Error {
  public code: IModelsErrorCode;
  public originalError: IModelsOriginalError | undefined;

  constructor(params: { code: IModelsErrorCode, message: string, originalError: IModelsOriginalError | undefined }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.originalError = params.originalError;
  }
}

export class IModelsErrorImpl extends IModelsErrorBaseImpl implements IModelsError {
  public details?: IModelsErrorDetail[];
  public statusCode?: number;

  constructor(params: {
    code: IModelsErrorCode;
    message: string;
    originalError: IModelsOriginalError | undefined;
    details: IModelsErrorDetail[] | undefined;
    statusCode: number | undefined;
  }) {
    super(params);
    this.details = params.details;
    this.statusCode = params.statusCode;
  }
}
