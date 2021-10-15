/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export class Constants {
  public static Api = {
    BaseUrl: "https://api.bentley.com/imodels",
    Version: "itwin-platform.v1"
  }

  public static Headers = {
    Accept: "Accept",
    Authorization: "Authorization",
    ContentType: "ContentType",
    Prefer: "Prefer",

    Values: {
      ContentType: "application/json"
    }
  }
}
