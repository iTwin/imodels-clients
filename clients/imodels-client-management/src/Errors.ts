/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsErrorCode, iModelsErrorDetail, iModelsError as iModelsErrorInterface } from "./PublicModels";

class iModelsError extends Error implements iModelsErrorInterface {
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

interface iModelsAPIErrorWrapper {
  error: iModelsAPIError;
}

interface iModelsAPIError {
  code: string;
  message?: string;
  details?: iModelsAPIErrorDetail[];
}

interface iModelsAPIErrorDetail {
  code: string;
  message: string;
  target: string;
}

export class iModelsErrorParser {
  public static parse(response: { statusCode: number, body: unknown }): iModelsError {
    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401) {
      return new iModelsError({ name: iModelsErrorCode.Unauthorized, code: iModelsErrorCode.Unauthorized, message: "" });
    }

    const errorFromAPI = response.body as iModelsAPIErrorWrapper;
    const errorCode: iModelsErrorCode = iModelsErrorParser.parseCode(errorFromAPI.error.code);

    return new iModelsError({
      name: errorCode,
      code: errorCode,
      message: errorFromAPI.error.message,
      details: errorFromAPI.error.details
        ? iModelsErrorParser.parseDetails(errorFromAPI.error.details)
        : undefined
    });
  }

  private static parseDetails(details: iModelsAPIErrorDetail[]): iModelsErrorDetail[] {
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

