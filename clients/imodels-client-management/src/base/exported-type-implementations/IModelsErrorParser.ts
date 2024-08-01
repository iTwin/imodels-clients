/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsApiErrorDetail, IModelsApiErrorWrapper, IModelsErrorImpl, UnwrappedError } from "../internal";
import { IModelsErrorCode, IModelsErrorDetail, IModelsOriginalError } from "../types";

export interface ResponseInfo {
  statusCode?: number;
  body?: unknown;
}

export class IModelsErrorParser {
  protected static readonly _defaultErrorMessage = "Unknown error occurred";
  protected static readonly _defaultUnauthorizedMessage = "Authorization failed";

  public static parse(response: ResponseInfo, originalError: IModelsOriginalError): Error {
    if (!response.body)
      return IModelsErrorParser.createUnrecognizedError(response, originalError);

    if (response.statusCode === 401)
      return IModelsErrorParser.createUnauthorizedError(response, originalError);

    const errorFromApi: IModelsApiErrorWrapper | undefined = response.body as IModelsApiErrorWrapper;
    const errorCode: IModelsErrorCode = IModelsErrorParser.parseCode(errorFromApi?.error?.code);

    if (errorCode === IModelsErrorCode.Unrecognized)
      return IModelsErrorParser.createUnrecognizedError(response, originalError);

    const errorDetails: IModelsErrorDetail[] | undefined = IModelsErrorParser.parseDetails(errorFromApi.error?.details);
    const errorMessage: string = IModelsErrorParser.parseAndFormatMessage(errorFromApi?.error?.message, errorDetails);

    return new IModelsErrorImpl({
      code: errorCode,
      statusCode: response.statusCode,
      originalError,
      message: errorMessage,
      details: errorDetails
    });
  }

  protected static parseCode(errorCode: string | undefined): IModelsErrorCode {
    if (!errorCode)
      return IModelsErrorCode.Unrecognized;

    const adjustedErrorCode = IModelsErrorParser.adjustErrorCodeCaseToMatchEnum(errorCode);
    let parsedCode: IModelsErrorCode | undefined = IModelsErrorCode[adjustedErrorCode as keyof typeof IModelsErrorCode];
    if (!parsedCode)
      parsedCode = IModelsErrorCode.Unrecognized;

    return parsedCode;
  }

  private static adjustErrorCodeCaseToMatchEnum(errorCode: string): string {
    return errorCode.replace("iModel", "IModel").replace("iTwin", "ITwin");
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

  private static createUnrecognizedError(response: ResponseInfo, originalError: IModelsOriginalError): Error {
    return new IModelsErrorImpl({
      code: IModelsErrorCode.Unrecognized,
      statusCode: response.statusCode,
      originalError,
      message: `${IModelsErrorParser._defaultErrorMessage}.\n` +
        `Original error message: ${originalError.message},\n` +
        `original error code: ${originalError.code},\n` +
        `response status code: ${response.statusCode},\n` +
        `response body: ${JSON.stringify(response.body)}`,
      details: undefined
    });
  }

  private static createUnauthorizedError(response: ResponseInfo, originalError: IModelsOriginalError): Error {
    const errorMessage = (response.body as IModelsApiErrorWrapper)?.error?.message
      ?? (response.body as UnwrappedError)?.message
      ?? IModelsErrorParser._defaultUnauthorizedMessage;
    return new IModelsErrorImpl({
      code: IModelsErrorCode.Unauthorized,
      statusCode: response.statusCode,
      originalError,
      message: errorMessage,
      details: undefined
    });
  }
}
