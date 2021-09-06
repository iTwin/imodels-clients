/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsError, iModelsErrorCode, iModelsErrorDetail } from "./interfaces/iModelsErrorInterfaces";
import { ParseErrorFunc } from "./rest/RestClient";

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

export class iModelsErrorImpl extends Error implements iModelsError {
  code: iModelsErrorCode;
  details?: iModelsErrorDetail[];

  constructor(params: { code: iModelsErrorCode, message: string, details?: iModelsErrorDetail[] }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.details = params.details;
  }
}

export class iModelsErrorParser {
  public static parse: ParseErrorFunc = (response: { statusCode: number, body: unknown }) => {
    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401) {
      return new iModelsErrorImpl({ code: iModelsErrorCode.Unauthorized, message: "" });
    }

    const errorFromApi = response.body as iModelsApiErrorWrapper;
    const errorCode: iModelsErrorCode = iModelsErrorParser.parseCode(errorFromApi?.error?.code);

    return new iModelsErrorImpl({
      code: errorCode,
      message: errorFromApi?.error?.message,
      details: errorFromApi?.error?.details
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
