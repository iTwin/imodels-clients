/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { decorate, inject, injectable } from "inversify";

import {
  IModelsClient,
  IModelsClientOptions,
} from "@itwin/imodels-client-authoring";

import { TestUtilTypes } from "../../TestUtilTypes";

decorate(injectable(), IModelsClient);

@injectable()
export class TestIModelsClient extends IModelsClient {
  constructor(
    @inject(TestUtilTypes.IModelsClientOptions)
    options: IModelsClientOptions
  ) {
    super(options);
  }
}
