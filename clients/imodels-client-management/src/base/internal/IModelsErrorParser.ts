/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  IModelsError,
  IModelsErrorCode,
  IModelsErrorDetail,
  IModelsOriginalError,
} from "../types";

interface UnwrappedError {
  message: string;
}

interface IModelsApiErrorWrapper {
  error: IModelsApiError;
}

export interface IModelsApiError {
  code: string;
  statusCode?: number;
  message?: string;
  details?: IModelsApiErrorDetail[];
}

interface IModelsApiErrorDetail {
  code: string;
  message: string;
  target: string;
}

export class IModelsErrorBaseImpl extends Error {
  public code: IModelsErrorCode;
  public originalError: IModelsOriginalError | undefined;

  constructor(params: {
    code: IModelsErrorCode;
    message: string;
    originalError: IModelsOriginalError | undefined;
  }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.originalError = params.originalError;
  }
}

export class IModelsErrorImpl
  extends IModelsErrorBaseImpl
  implements IModelsError
{
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

export interface ResponseInfo {
  statusCode?: number;
  body?: unknown;
}

export class IModelsErrorParser {
  protected static readonly _defaultErrorMessage = "Unknown error occurred";
  protected static readonly _defaultUnauthorizedMessage =
    "Authorization failed";

  public static parse(
    response: ResponseInfo,
    originalError: IModelsOriginalError
  ): Error {
    if (!response.body)
      return IModelsErrorParser.createUnrecognizedError(
        response,
        originalError
      );

    if (response.statusCode === 401)
      return IModelsErrorParser.createUnauthorizedError(
        response,
        originalError
      );

    const errorFromApi: IModelsApiErrorWrapper | undefined =
      response.body as IModelsApiErrorWrapper;
    const errorCode: IModelsErrorCode = IModelsErrorParser.parseCode(
      errorFromApi?.error?.code
    );

    if (errorCode === IModelsErrorCode.Unrecognized)
      return IModelsErrorParser.createUnrecognizedError(
        response,
        originalError
      );

    const errorDetails: IModelsErrorDetail[] | undefined =
      IModelsErrorParser.parseDetails(errorFromApi.error?.details);
    const errorMessage: string = IModelsErrorParser.parseAndFormatMessage(
      errorFromApi?.error?.message,
      errorDetails
    );

    return new IModelsErrorImpl({
      code: errorCode,
      statusCode: response.statusCode,
      originalError,
      message: errorMessage,
      details: errorDetails,
    });
  }

  protected static parseCode(errorCode: string | undefined): IModelsErrorCode {
    if (!errorCode) return IModelsErrorCode.Unrecognized;

    const adjustedErrorCode =
      IModelsErrorParser.adjustErrorCodeCaseToMatchEnum(errorCode);
    let parsedCode: IModelsErrorCode | undefined =
      IModelsErrorCode[adjustedErrorCode as keyof typeof IModelsErrorCode];
    if (!parsedCode) parsedCode = IModelsErrorCode.Unrecognized;

    return parsedCode;
  }

  private static adjustErrorCodeCaseToMatchEnum(errorCode: string): string {
    return errorCode.replace("iModel", "IModel").replace("iTwin", "ITwin");
  }

  private static parseDetails(
    details: IModelsApiErrorDetail[] | undefined
  ): IModelsErrorDetail[] | undefined {
    if (!details) return undefined;

    return details.map((unparsedDetail) => {
      return { ...unparsedDetail, code: this.parseCode(unparsedDetail.code) };
    });
  }

  private static parseAndFormatMessage(
    message: string | undefined,
    errorDetails: IModelsErrorDetail[] | undefined
  ): string {
    let result = message ?? IModelsErrorParser._defaultErrorMessage;
    if (!errorDetails || errorDetails.length === 0) return result;

    result += " Details:\n";
    for (let i = 0; i < errorDetails.length; i++) {
      result += `${i + 1}. ${errorDetails[i].code}: ${errorDetails[i].message}`;
      if (errorDetails[i].target)
        result += ` Target: ${errorDetails[i].target}.`;
      result += "\n";
    }

    return result;
  }

  private static createUnrecognizedError(
    response: ResponseInfo,
    originalError: IModelsOriginalError
  ): Error {
    return new IModelsErrorImpl({
      code: IModelsErrorCode.Unrecognized,
      statusCode: response.statusCode,
      originalError,
      message:
        `${IModelsErrorParser._defaultErrorMessage}.\n` +
        `Original error message: ${originalError.message},\n` +
        `original error code: ${originalError.code},\n` +
        `response status code: ${response.statusCode},\n` +
        `response body: ${JSON.stringify(response.body)}`,
      details: undefined,
    });
  }

  private static createUnauthorizedError(
    response: ResponseInfo,
    originalError: IModelsOriginalError
  ): Error {
    const errorMessage =
      (response.body as IModelsApiErrorWrapper)?.error?.message ??
      (response.body as UnwrappedError)?.message ??
      IModelsErrorParser._defaultUnauthorizedMessage;
    return new IModelsErrorImpl({
      code: IModelsErrorCode.Unauthorized,
      statusCode: response.statusCode,
      originalError,
      message: errorMessage,
      details: undefined,
    });
  }
}
