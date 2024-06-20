/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export class Constants {
  public static api = {
    baseUrl: "https://api.bentley.com/imodels",
    version: "itwin-platform.v2"
  };

  public static headers = {
    accept: "Accept",
    authorization: "Authorization",
    contentType: "Content-Type",
    prefer: "Prefer",
    location: "Location"
  };

  public static time = {
    sleepPeriodInMs: 1000,
    iModelInitializationTimeOutInMs: 5 * 60 * 1000
  };

  public static httpStatusCodes = {
    requestTimeout: 408,
    internalServerError: 500
  };
}
