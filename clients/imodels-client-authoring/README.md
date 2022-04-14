# @itwin/imodels-client-authoring

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains an API client that exposes a subset of [iModels API](https://developer.bentley.com/apis/imodels/) operations - it extends the client from the [`@itwin/imodels-client-management`](../imodels-client-management/README.md) package and adds more operations that enable applications to author iModels - acquire Birefcases, manage Locks, etc. This library also adds the ability to perform iModel operations that include file transfer - create or download Changesets, create iModel from Baseline file.

## Usage examples

***Note:*** Since the `@itwin/imodels-client-authoring` package extends the [`@itwin/imodels-client-management`](../imodels-client-management/README.md) package all usage examples presented for the `@itwin/imodels-client-management` package are valid for this one as well.

### Authorization

`IModelsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IModelsClient` in iTwin.js platform based applications which use `IModelApp.getAccessToken` or `IModelHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IModelsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@itwin/imodels-access-frontend`](../../itwin-platform-access/imodels-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@itwin/imodels-access-backend`](../../itwin-platform-access/imodels-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.
```typescript
const iModelIterator: EntityListIterator<MinimalIModel> = iModelsClient.iModels.getMinimalList({
  authorization: AccessTokenAdapter.toAuthorizationCallback(await IModelHost.getAccessToken()),
  urlParams: {
    projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc"
  }
});
```

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