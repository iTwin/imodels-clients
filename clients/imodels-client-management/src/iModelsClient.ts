/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsErrorParser } from "./Errors";
import { iModelOperations } from "./operations/iModelOperations";
import { RESTClient } from "./RESTClient";

export class iModelsClient {
  private _restClient: RESTClient;

  constructor() {
    this._restClient = new RESTClient(iModelsErrorParser.parse);
  }
  
  public get iModels(): iModelOperations {
    return new iModelOperations(this._restClient);
  }
}
