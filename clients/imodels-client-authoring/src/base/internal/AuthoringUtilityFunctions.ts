/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  ClientStorage,
  StrategyClientStorage,
} from "@itwin/object-storage-core";

export async function createDefaultClientStorage(): Promise<ClientStorage> {
  const clients = [];

  try {
    const { AzureClientStorage, BlockBlobClientWrapperFactory } = await import(
      "@itwin/object-storage-azure"
    );
    clients.push({
      instanceName: "azure",
      instance: new AzureClientStorage(new BlockBlobClientWrapperFactory()),
    });
  } catch {
    throw new Error(
      "Azure client storage is not available. Please install @itwin/object-storage-azure package."
    );
  }

  try {
    const { GoogleClientStorage } = await import(
      "@itwin/object-storage-google/lib/client"
    );
    const { ClientStorageWrapperFactory } = await import(
      "@itwin/object-storage-google/lib/client/wrappers"
    );
    clients.push({
      instanceName: "google",
      instance: new GoogleClientStorage(new ClientStorageWrapperFactory()),
    });
  } catch {
    throw new Error(
      "Google client storage is not available. Please install @itwin/object-storage-google package."
    );
  }

  return new StrategyClientStorage(clients);
}
