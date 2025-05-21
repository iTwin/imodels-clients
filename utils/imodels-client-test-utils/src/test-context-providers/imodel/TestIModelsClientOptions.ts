/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { ApiOptions } from "@itwin/imodels-client-management";
import { GoogleClientStorage } from "@itwin/object-storage-google/lib/client";
import { ClientStorageWrapperFactory } from "@itwin/object-storage-google/lib/client/wrappers";

import {
  AzureClientStorage,
  BlockBlobClientWrapperFactory,
} from "@itwin/object-storage-azure";
import {
  ClientStorage,
  StrategyClientStorage,
} from "@itwin/object-storage-core";

import { IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig";

@injectable()
export class TestIModelsClientOptions implements IModelsClientOptions {
  public api: ApiOptions;
  public cloudStorage: ClientStorage;

  constructor(config: IModelsClientsTestsConfig) {
    this.api = { baseUrl: config.apis.iModels.baseUrl };
    this.cloudStorage = new StrategyClientStorage([
      {
        instanceName: "azure",
        instance: new AzureClientStorage(new BlockBlobClientWrapperFactory()),
      },
      {
        instanceName: "google",
        instance: new GoogleClientStorage(new ClientStorageWrapperFactory()),
      },
    ]);
  }
}
