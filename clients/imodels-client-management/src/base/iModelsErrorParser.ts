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

export function isiModelsApiError(error: unknown): error is iModelsError {
  const errorCode: unknown = (error as iModelsError)?.code;
  return errorCode !== undefined && typeof errorCode === "string";
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
  private static readonly _defaultErrorMessage = "Unknown error occurred";

  public static parse: ParseErrorFunc = (response: { statusCode?: number, body?: unknown }) => {
    if (!response.statusCode)
      return new iModelsErrorImpl({ code: iModelsErrorCode.Unknown, message: iModelsErrorParser._defaultErrorMessage });


    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401)
      return new iModelsErrorImpl({ code: iModelsErrorCode.Unauthorized, message: "The user is unauthorized. Please provide valid authentication credentials." });


    const errorFromApi: iModelsApiErrorWrapper | undefined = response.body as iModelsApiErrorWrapper;
    const errorCode: iModelsErrorCode = iModelsErrorParser.parseCode(errorFromApi?.error?.code);
    const errorMessage = errorFromApi?.error?.message ?? iModelsErrorParser._defaultErrorMessage;
    const errorDetails: iModelsErrorDetail[] | undefined = errorFromApi?.error?.details
      ? iModelsErrorParser.parseDetails(errorFromApi.error.details)
      : undefined

    return new iModelsErrorImpl({
      code: errorCode,
      message: iModelsErrorParser.formErrorMessage(errorMessage, errorDetails),
      details: errorDetails
    });
  }

  private static formErrorMessage(message: string, errorDetails: iModelsErrorDetail[] | undefined): string {
    if (!errorDetails || errorDetails.length === 0)
      return message;

    return `${message} Details: ${JSON.stringify(errorDetails)}`
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
