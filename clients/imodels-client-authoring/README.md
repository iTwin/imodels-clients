# @itwin/imodels-client-authoring

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains an API client that exposes a subset of [iModels API](https://developer.bentley.com/apis/imodels/) operations - it extends the client from the [`@itwin/imodels-client-management`](../imodels-client-management/README.md) package and adds more operations that enable applications to author iModels - acquire Birefcases, manage Locks, etc. This library also adds the ability to perform iModel operations that include file transfer - create or download Changesets, create iModel from Baseline file.

## Usage examples

**Note:** Since the `@itwin/imodels-client-authoring` package extends the [`@itwin/imodels-client-management`](../imodels-client-management/README.md) package all usage examples presented for the `@itwin/imodels-client-management` package are valid for this one as well.

### Create iModel from Baseline File
```typescript
import { Authorization, IModel, IModelsClient } from "@itwin/imodels-client-authoring";

/** Function that creates a new iModel from Baseline file and prints its id to the console. */
async function createIModelFromBaselineFile(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const iModel: IModel = await iModelsClient.iModels.createFromBaseline({
    authorization: () => getAuthorization(),
    iModelProperties: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
      name: "Sun City Renewable-energy Plant",
      description: "Overall model of wind and solar farms in Sun City",
      filePath: "D:\\imodels\\sun-city.bim"
    }
  });

  console.log(iModel.id);
}

/** Function that returns valid authorization information. */
async function getAuthorization(): Promise<Authorization> {
  return { scheme: "Bearer", token: "ey..." };
}
```