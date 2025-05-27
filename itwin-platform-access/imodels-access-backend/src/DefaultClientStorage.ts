/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

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

export function createDefaultClientStorage(): ClientStorage {
  return new StrategyClientStorage([
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
