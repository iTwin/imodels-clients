# @itwin/imodels-client-management

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains an API client that exposes a subset of [iModels API](https://developer.bentley.com/apis/imodels-v2/) operations that enable applications to manage iModels - query Changesets, Locks and other related entities, create Named Versions, etc. This is a lightweight library intended to be used by iTwin management applications that do not write any data into the iModel itself.

Please see the [list of key methods and types](../../docs/IModelsClientManagement.md) to discover what API operations are exposed by this client package.

### Authorization

`IModelsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IModelsClient` in iTwin.js platform based applications which use `IModelApp.getAccessToken` or `IModelHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IModelsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@itwin/imodels-access-frontend`](../../itwin-platform-access/imodels-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@itwin/imodels-access-backend`](../../itwin-platform-access/imodels-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.

```typescript
const iModelIterator: EntityListIterator<MinimalIModel> =
  iModelsClient.iModels.getMinimalList({
    authorization: AccessTokenAdapter.toAuthorizationCallback(IModelApp.getAccessToken),
    urlParams: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
    },
  });
```

### Headers

To include custom headers in your requests, you have the option to provide additional headers or header factories. When constructing an instance of `IModelsClient`, any headers passed to the constructor will be automatically added to all requests made by the client. On the other hand, when invoking specific operations, you can pass headers through the operation parameters, which will be included only in the requests related to that particular operation. If a header with the same key is specified in both the constructor and operation parameters, the header from the operation parameters will overwrite the corresponding header from the constructor.

**Note:** Whitespace values, such as empty strings or spaces are treated as regular headers in our requests. This means that if you provide a whitespace header value it will be sent with the request.

```typescript
iModelsClient = new IModelsClient({
  headers: {
    "X-Correlation-Id": () => "xCorrelationIdValue",
    "some-custom-header": "someCustomValue",
  },
});

iModelsClient.baselineFiles.getSingle({
  headers: {
    "X-Correlation-Id": "some value that overrides factory",
    "new-custom-header": "header that will be sent in this operation requests",
  },
});
```

### Get all project iModels

```typescript
import {
  Authorization,
  EntityListIterator,
  IModelsClient,
  MinimalIModel,
} from "@itwin/imodels-client-management";

/** Function that queries all iModels for a particular project and prints their ids to the console. */
async function printiModelIds(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const iModelIterator: EntityListIterator<MinimalIModel> =
    iModelsClient.iModels.getMinimalList({
      authorization: () => getAuthorization(),
      urlParams: {
        projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
      },
    });

  for await (const iModel of iModelIterator) console.log(iModel.id);
}

/** Function that returns valid authorization information. */
async function getAuthorization(): Promise<Authorization> {
  return { scheme: "Bearer", token: "ey..." };
}
```

### Get an iModel with a specific name

```typescript
import {
  EntityListIterator,
  IModel,
  IModelsClient,
  toArray,
} from "@itwin/imodels-client-management";

/** Function that queries an iModel with a specific name. Function returns `undefined` if such iModel does not exist. */
async function getiModel(): Promise<IModel | undefined> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const iModelIterator: EntityListIterator<IModel> =
    iModelsClient.iModels.getRepresentationList({
      authorization: () => getAuthorization(),
      urlParams: {
        projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc",
        name: "Sun City Renewable-energy Plant",
      },
    });

  const iModelArray = await toArray(iModelIterator);
  if (iModelArray.length === 0) return undefined;

  const iModel = iModelArray[0];
  return iModel;
}
```

### Get all iModel Changesets

```typescript
import {
  Authorization,
  EntityListIterator,
  IModelsClient,
  MinimalChangeset,
} from "@itwin/imodels-client-management";

/** Function that queries all Changesets for a particular iModel and prints their ids to the console. */
async function printChangesetIds(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const changesetIterator: EntityListIterator<MinimalChangeset> =
    iModelsClient.changesets.getMinimalList({
      authorization: () => getAuthorization(),
      iModelId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc",
    });

  for await (const changeset of changesetIterator) console.log(changeset.id);
}
```

### Create a Named Version on a Changeset

```typescript
import {
  Authorization,
  IModelsClient,
  NamedVersion,
} from "@itwin/imodels-client-management";

/** Function that creates a Named Version on a particular changeset and prints its id to the console. */
async function createNamedVersion(): Promise<void> {
  const iModelsClient: IModelsClient = new IModelsClient();
  const namedVersion: NamedVersion = await iModelsClient.namedVersions.create({
    authorization: () => getAuthorization(),
    iModelId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc",
    namedVersionProperties: {
      name: "Milestone",
      changesetId: "bd51c08eb44f40d49fee9a0c7d6fc018c3b5ba3f",
    },
  });

  console.log(namedVersion.id);
}
```
