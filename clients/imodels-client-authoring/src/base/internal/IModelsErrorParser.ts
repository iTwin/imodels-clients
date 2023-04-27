/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsApiError, IModelsErrorBaseImpl, IModelsErrorParser as ManagementIModelsErrorParser, OriginalError, ResponseInfo } from "@itwin/imodels-client-management/lib/base/internal";

import { IModelsErrorCode } from "@itwin/imodels-client-management";

import { ConflictingLock, ConflictingLocksError, LocksError } from "../types/apiEntities/LockErrorInterfaces";

interface AuthoringIModelsApiErrorWrapper {
  error: AuthoringIModelsApiError;
}

interface AuthoringIModelsApiError extends IModelsApiError {
  objectIds?: string[];
  conflictingLocks?: ConflictingLock[];
}

class LocksErrorImpl extends IModelsErrorBaseImpl implements LocksError {
  public objectIds?: string[];

  constructor(params: {
    code: IModelsErrorCode;
    message: string;
    objectIds?: string[];
  }) {
    super(params);
    this.objectIds = params.objectIds;
  }
}

class ConflictingLocksErrorImpl extends IModelsErrorBaseImpl implements ConflictingLocksError {
  public conflictingLocks?: ConflictingLock[];

  constructor(params: {
    code: IModelsErrorCode;
    message: string;
    conflictingLocks?: ConflictingLock[];
  }) {
    super(params);
    this.conflictingLocks = params.conflictingLocks;
  }
}

export class IModelsErrorParser extends ManagementIModelsErrorParser {
  public static override parse(response: ResponseInfo, originalError: OriginalError): Error {
    const errorFromApi: AuthoringIModelsApiErrorWrapper | undefined =
      response.body as AuthoringIModelsApiErrorWrapper;
    const errorCode: IModelsErrorCode = IModelsErrorParser.parseCode(errorFromApi?.error?.code);

    if (errorCode === IModelsErrorCode.NewerChangesExist) {
      const errorMessage = IModelsErrorParser.parseAndFormatLockErrorMessage(
        errorFromApi?.error?.message,
        errorFromApi?.error?.objectIds
      );
      return new LocksErrorImpl({
        code: errorCode,
        message: errorMessage,
        objectIds: errorFromApi?.error?.objectIds
      });
    }

    if (errorCode === IModelsErrorCode.ConflictWithAnotherUser) {
      const errorMessage = IModelsErrorParser.parseAndFormatLockConflictErrorMessage(
        errorFromApi?.error?.message,
        errorFromApi?.error?.conflictingLocks
      );
      return new ConflictingLocksErrorImpl({
        code: errorCode,
        message: errorMessage,
        conflictingLocks: errorFromApi?.error?.conflictingLocks
      });
    }

    return ManagementIModelsErrorParser.parse(response, originalError);
  }

  private static parseAndFormatLockErrorMessage(
    message: string | undefined,
    objectIds: string[] | undefined
  ): string {
    let result = message ?? ManagementIModelsErrorParser._defaultErrorMessage;
    if (!objectIds || objectIds.length === 0)
      return result;

    result += ` Object ids: ${objectIds.join(" ,")}`;
    return result;
  }

  private static parseAndFormatLockConflictErrorMessage(
    message: string | undefined,
    conflictingLocks: ConflictingLock[] | undefined
  ) {
    let result = message ?? ManagementIModelsErrorParser._defaultErrorMessage;
    if (!conflictingLocks || conflictingLocks.length === 0)
      return result;

    result += " Conflicting locks:\n";
    for (let i = 0; i < conflictingLocks.length; i++) {
      result += `${i + 1}. Object id: ${conflictingLocks[i].objectId
      }, lock level: ${conflictingLocks[i].lockLevel
      }, briefcase ids: ${conflictingLocks[i].briefcaseIds.join(", ")
      }\n`;
    }
    return result;
  }
}
