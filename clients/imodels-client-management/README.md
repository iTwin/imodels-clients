# @itwin/imodels-client-management

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains an API client that exposes a subset of [iModels API](https://developer.bentley.com/apis/imodels/) operations that enable applications to manage iModels - query Changesets, Locks and other related entities, create Named Versions, etc. This is a lightweight library intended to be used by iTwin management applications that do not write any data into the iModel itself, an example of such application is the [iTwin Demo Portal](https://itwindemo.bentley.com/).

## Usage examples

### Authorization

`IModelsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IModelsClient` in iTwin.js platform based applications which use `IModelApp.getAccessToken` or `IModelHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IModelsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@itwin/imodels-access-frontend`](../../itwin-platform-access/imodels-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@itwin/imodels-access-backend`](../../itwin-platform-access/imodels-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.
```typescript
const iModelIterator: EntityListIterator<MinimalIModel> = iModelsClient.iModels.getMinimalList({
  authorization: AccessTokenAdapter.toAuthorizationCallback(await IModelApp.getAccessToken()),
  urlParams: {
    projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc"
  }
});
```

### Get all project iModels
```typescript
import { Authorization, EntityListIterator, IModelsClient, MinimalIModel } from "@itwin/imodels-client-management";

/** Function that queries all iModels for a particular project and prints their ids to the console. */
async function printiModelIds(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const iModelIterator: EntityListIterator<MinimalIModel> = iModelsClient.iModels.getMinimalList({
    authorization: () => getAuthorization(),
    urlParams: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc"
    }
  });

  for await (const iModel of iModelIterator)
    console.log(iModel.id);
}

/** Function that returns valid authorization information. */
async function getAuthorization(): Promise<Authorization> {
  return { scheme: "Bearer", token: "ey..." };
}
```

### Get all iModel Changesets
```typescript
import { Authorization, EntityListIterator, IModelsClient, MinimalChangeset } from "@itwin/imodels-client-management";

/** Function that queries all Changesets for a particular iModel and prints their ids to the console. */
async function printChangesetIds(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const changesetIterator: EntityListIterator<MinimalChangeset> = iModelsClient.changesets.getMinimalList({
    authorization: () => getAuthorization(),
    iModelId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc"
  });

  for await (const changeset of changesetIterator)
    console.log(changeset.id);
}
```

### Create a Named Version on a Changeset
```typescript
import { Authorization, IModelsClient, NamedVersion } from "@itwin/imodels-client-management";

/** Function that creates a Named Version on a particular changeset and prints its id to the console. */
async function createNamedVersion(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const namedVersion: NamedVersion = await iModelsClient.namedVersions.create({
    authorization: () => getAuthorization(),
    iModelId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc",
    namedVersionProperties: {
      name: "Milestone",
      changesetId: "bd51c08eb44f40d49fee9a0c7d6fc018c3b5ba3f"
    }
  });

  console.log(namedVersion.id);
}
```
