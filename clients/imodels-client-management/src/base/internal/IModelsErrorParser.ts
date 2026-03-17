/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ConflictingLock,
  ConflictingLocksError,
  IModelsError,
  IModelsErrorCode,
  IModelsErrorDetail,
  IModelsOriginalError,
  LocksError,
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
  objectIds?: string[];
  conflictingLocks?: ConflictingLock[];
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

class LocksErrorImpl extends IModelsErrorBaseImpl implements LocksError {
  public objectIds?: string[];

  constructor(params: {
    code: IModelsErrorCode;
    message: string;
    originalError: IModelsOriginalError | undefined;
    objectIds?: string[];
  }) {
    super(params);
    this.objectIds = params.objectIds;
  }
}

class ConflictingLocksErrorImpl
  extends IModelsErrorBaseImpl
  implements ConflictingLocksError
{
  public conflictingLocks?: ConflictingLock[];

  constructor(params: {
    code: IModelsErrorCode;
    message: string;
    originalError: IModelsOriginalError | undefined;
    conflictingLocks?: ConflictingLock[];
  }) {
    super(params);
    this.conflictingLocks = params.conflictingLocks;
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

    if (errorCode === IModelsErrorCode.NewerChangesExist) {
      const errorMessage = IModelsErrorParser.parseAndFormatLockErrorMessage(
        errorFromApi?.error?.message,
        errorFromApi?.error?.objectIds
      );
      return new LocksErrorImpl({
        code: errorCode,
        message: errorMessage,
        originalError,
        objectIds: errorFromApi?.error?.objectIds,
      });
    }

    if (errorCode === IModelsErrorCode.ConflictWithAnotherUser) {
      const errorMessage =
        IModelsErrorParser.parseAndFormatLockConflictErrorMessage(
          errorFromApi?.error?.message,
          errorFromApi?.error?.conflictingLocks
        );
      return new ConflictingLocksErrorImpl({
        code: errorCode,
        message: errorMessage,
        originalError,
        conflictingLocks: errorFromApi?.error?.conflictingLocks,
      });
    }

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

  private static parseAndFormatLockErrorMessage(
    message: string | undefined,
    objectIds: string[] | undefined
  ): string {
    let result = message ?? IModelsErrorParser._defaultErrorMessage;
    if (!objectIds || objectIds.length === 0) return result;

    result += ` Object ids: ${objectIds.join(" ,")}`;
    return result;
  }

  private static parseAndFormatLockConflictErrorMessage(
    message: string | undefined,
    conflictingLocks: ConflictingLock[] | undefined
  ): string {
    let result = message ?? IModelsErrorParser._defaultErrorMessage;
    if (!conflictingLocks || conflictingLocks.length === 0) return result;

    result += " Conflicting locks:\n";
    for (let i = 0; i < conflictingLocks.length; i++) {
      result += `${i + 1}. Object id: ${
        conflictingLocks[i].objectId
      }, lock level: ${
        conflictingLocks[i].lockLevel
      }, briefcase ids: ${conflictingLocks[i].briefcaseIds.join(", ")}\n`;
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
