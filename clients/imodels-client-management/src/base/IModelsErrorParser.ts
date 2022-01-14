/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsError, IModelsErrorCode, IModelsErrorDetail } from "./interfaces/IModelsErrorInterfaces";

interface IModelsApiErrorWrapper {
  error: IModelsApiError;
}

interface IModelsApiError {
  code: string;
  message?: string;
  details?: IModelsApiErrorDetail[];
}

interface IModelsApiErrorDetail {
  code: string;
  message: string;
  target: string;
}

export function isIModelsApiError(error: unknown): error is IModelsError {
  const errorCode: unknown = (error as IModelsError)?.code;
  return errorCode !== undefined && typeof errorCode === "string";
}

export class IModelsErrorImpl extends Error implements IModelsError {
  public code: IModelsErrorCode;
  public details?: IModelsErrorDetail[];

  constructor(params: { code: IModelsErrorCode, message: string, details?: IModelsErrorDetail[] }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.details = params.details;
  }
}

export class IModelsErrorParser {
  private static readonly _defaultErrorMessage = "Unknown error occurred";

  public static parse(response: { statusCode?: number, body?: unknown }): Error {
    if (!response.statusCode)
      return new IModelsErrorImpl({ code: IModelsErrorCode.Unknown, message: IModelsErrorParser._defaultErrorMessage });

    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401)
      return new IModelsErrorImpl({ code: IModelsErrorCode.Unauthorized, message: "The user is unauthorized. Please provide valid authentication credentials." });

    const errorFromApi: IModelsApiErrorWrapper | undefined = response.body as IModelsApiErrorWrapper;
    const errorCode: IModelsErrorCode = IModelsErrorParser.parseCode(errorFromApi?.error?.code);
    const errorDetails: IModelsErrorDetail[] | undefined = IModelsErrorParser.parseDetails(errorFromApi.error?.details);
    const errorMessage: string = IModelsErrorParser.parseAndFormatMessage(errorFromApi?.error?.message, errorDetails);

    return new IModelsErrorImpl({
      code: errorCode,
      message: errorMessage,
      details: errorDetails
    });
  }

  private static parseCode(errorCode: string | undefined): IModelsErrorCode {
    if (!errorCode)
      return IModelsErrorCode.Unrecognized;

    const adjustedErrorCode = IModelsErrorParser.adjustErrorCodeCaseToMatchEnum(errorCode);
    let parsedCode: IModelsErrorCode | undefined = IModelsErrorCode[adjustedErrorCode as keyof typeof IModelsErrorCode];
    if (!parsedCode)
      parsedCode = IModelsErrorCode.Unrecognized;

    return parsedCode;
  }

  private static adjustErrorCodeCaseToMatchEnum(errorCode: string): string {
    return errorCode.replace("iModel", "IModel");
  }

  private static parseDetails(details: IModelsApiErrorDetail[] | undefined): IModelsErrorDetail[] | undefined {
    if (!details)
      return undefined;

    return details.map((unparsedDetail) => {
      return { ...unparsedDetail, code: this.parseCode(unparsedDetail.code) };
    });
  }

  private static parseAndFormatMessage(message: string | undefined, errorDetails: IModelsErrorDetail[] | undefined): string {
    let result = message ?? IModelsErrorParser._defaultErrorMessage;
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
