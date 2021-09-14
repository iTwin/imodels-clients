/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as dotenv from "dotenv";
import { TestSetupError } from "./CommonTestUtils";

export interface ConfigValues {
  DefaultiModelName: string;
  ApiBaseUrl: string;
}

export class Config {
  private static _config: ConfigValues;

  public static get(): ConfigValues {
    return this._config ?? this.load();
  }

  private static load(): ConfigValues {
    dotenv.config();

    if (!process.env.TEST_IMODEL_NAME)
      throw new TestSetupError("Invalid configuration: missing TEST_IMODEL_NAME.");

    if (!process.env.API_BASE_URL)
      throw new TestSetupError("Invalid configuration: missing API_BASE_URL.");

    return {
      DefaultiModelName: process.env.TEST_IMODEL_NAME,
      ApiBaseUrl: process.env.API_BASE_URL
    };
  }
}
