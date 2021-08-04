/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsErrorParser } from "./Errors";
import { iModelOperations } from "./operations/iModelOperations";

export class iModelsClient {
  public get iModels(): iModelOperations {
    return new iModelOperations(iModelsErrorParser.parse);
  }
}