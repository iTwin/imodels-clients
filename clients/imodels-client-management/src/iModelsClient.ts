/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsErrorParser } from "./Errors";
import { iModelOperations } from "./operations/imodel/iModelOperations";
import { RestClient } from "./RESTClient";

export class iModelsClient {
  private _restClient: RestClient;

  constructor() {
    this._restClient = new RestClient(iModelsErrorParser.parse);
  }

  public get iModels(): iModelOperations {
    return new iModelOperations(this._restClient);
  }
}
