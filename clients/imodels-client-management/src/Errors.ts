/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ParseErrorFunc } from "./RESTClient";

export enum iModelsErrorCode {
  Unrecognized = "Unrecognized",

  Unknown = "Unknown",
  Unauthorized = "Unauthorized",

  InvalidiModelsRequest = "InvalidiModelsRequest",
  InvalidValue = "InvalidValue",
  iModelExists = "iModelExists"
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

interface iModelsApiErrorWrapper {
  error: iModelsApiError;
}

interface iModelsApiError {
  code: string;
  message?: string;
  details?: iModelsApiErrorDetail[];
}

interface iModelsApiErrorDetail {
  code: string;
  message: string;
  target: string;
}

class iModelsErrorImpl extends Error implements iModelsError {
  code: iModelsErrorCode;
  details?: iModelsErrorDetail[];

  constructor(params: { name: string, code: iModelsErrorCode, message: string, details?: iModelsErrorDetail[] }) {
    super();
    this.name = params.name;
    this.code = params.code;
    this.message = params.message;
    this.details = params.details;
  }
}

export class iModelsErrorParser {
  public static parse: ParseErrorFunc = (response: { statusCode: number, body: unknown }) => {
    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401) {
      return new iModelsErrorImpl({ name: iModelsErrorCode.Unauthorized, code: iModelsErrorCode.Unauthorized, message: "" });
    }

    const errorFromApi = response.body as iModelsApiErrorWrapper;
    const errorCode: iModelsErrorCode = iModelsErrorParser.parseCode(errorFromApi.error.code);

    return new iModelsErrorImpl({
      name: errorCode,
      code: errorCode,
      message: errorFromApi.error.message,
      details: errorFromApi.error.details
        ? iModelsErrorParser.parseDetails(errorFromApi.error.details)
        : undefined
    });
  }

  private static parseDetails(details: iModelsApiErrorDetail[]): iModelsErrorDetail[] {
    return details.map(unparsedDetail => {
      return { ...unparsedDetail, code: this.parseCode(unparsedDetail.code) };
    });
  }

  private static parseCode(errorCode: string): iModelsErrorCode {
    let parsedCode: iModelsErrorCode | undefined = iModelsErrorCode[errorCode as keyof typeof iModelsErrorCode];
    if (!parsedCode)
      parsedCode = iModelsErrorCode.Unrecognized;

    return parsedCode;
  }
}
