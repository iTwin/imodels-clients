/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { GoogleClientStorage } from "@itwin/object-storage-google/lib/client/index.js";
import { ClientStorageWrapperFactory } from "@itwin/object-storage-google/lib/client/wrappers/index.js";

import {
  AzureClientStorage,
  BlockBlobClientWrapperFactory,
} from "@itwin/object-storage-azure";
import {
  ClientStorage,
  StrategyClientStorage,
  RetryOptions,
} from "@itwin/object-storage-core";

export function createDefaultClientStorage(
  retryOptions?: RetryOptions
): ClientStorage {
  return new StrategyClientStorage([
    {
      instanceName: "azure",
      instance: new AzureClientStorage(
        new BlockBlobClientWrapperFactory(retryOptions)
      ),
    },
    {
      instanceName: "google",
      instance: new GoogleClientStorage(
        new ClientStorageWrapperFactory(retryOptions)
      ),
    },
  ]);
}
