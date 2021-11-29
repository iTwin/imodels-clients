/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsError, iModelsErrorCode, iModelsErrorDetail } from "./interfaces/iModelsErrorInterfaces";

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
  public code: iModelsErrorCode;
  public details?: iModelsErrorDetail[];

  constructor(params: { code: iModelsErrorCode, message: string, details?: iModelsErrorDetail[] }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.details = params.details;
  }
}

export class iModelsErrorParser {
  private static readonly _defaultErrorMessage = "Unknown error occurred";

  public static parse(response: { statusCode?: number, body?: unknown }): Error {
    if (!response.statusCode)
      return new iModelsErrorImpl({ code: iModelsErrorCode.Unknown, message: iModelsErrorParser._defaultErrorMessage });

    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401)
      return new iModelsErrorImpl({ code: iModelsErrorCode.Unauthorized, message: "The user is unauthorized. Please provide valid authentication credentials." });

    const errorFromApi: iModelsApiErrorWrapper | undefined = response.body as iModelsApiErrorWrapper;
    const errorCode: iModelsErrorCode = iModelsErrorParser.parseCode(errorFromApi?.error?.code);
    const errorDetails: iModelsErrorDetail[] | undefined = iModelsErrorParser.parseDetails(errorFromApi.error?.details);
    const errorMessage: string = iModelsErrorParser.parseAndFormatMessage(errorFromApi?.error?.message, errorDetails);

    return new iModelsErrorImpl({
      code: errorCode,
      message: errorMessage,
      details: errorDetails
    });
  }

  private static parseCode(errorCode: string): iModelsErrorCode {
    let parsedCode: iModelsErrorCode | undefined = iModelsErrorCode[errorCode as keyof typeof iModelsErrorCode];
    if (!parsedCode)
      parsedCode = iModelsErrorCode.Unrecognized;

    return parsedCode;
  }

  private static parseDetails(details: iModelsApiErrorDetail[] | undefined): iModelsErrorDetail[] | undefined {
    if (!details)
      return undefined;

    return details.map((unparsedDetail) => {
      return { ...unparsedDetail, code: this.parseCode(unparsedDetail.code) };
    });
  }

  private static parseAndFormatMessage(message: string | undefined, errorDetails: iModelsErrorDetail[] | undefined): string {
    let result = message ?? iModelsErrorParser._defaultErrorMessage;
    if (!errorDetails || errorDetails.length === 0)
      return result;

    result += " Details:\n";
    for (let i = 0; i < errorDetails.length; i++) {
      result += `${i + 1}. ${errorDetails[i].code}: ${errorDetails[i].message}`;
      if (errorDetails[i].target)
        result += ` Target: ${errorDetails[i].target}.`;
      result += "\n";
    }

    return result;
  }
}
