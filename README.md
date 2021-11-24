# iTwin.js

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

[iTwin.js](http://www.itwinjs.org) is an open source platform for creating, querying, modifying, and displaying Infrastructure Digital Twins. To learn more about the iTwin Platform and its APIs, visit the [iTwin developer portal](https://developer.bentley.com/).

If you have questions, or wish to contribute to iTwin.js, see our [Contributing guide](https://github.com/iTwin/itwinjs-core/blob/master/CONTRIBUTING.md).

## About this Repository

This repository contains packages that help consumption of iModels API. Please visit the [iModels API documentation page](https://developer.bentley.com/apis/imodels/) on iTwin developer portal to learn more about the iModels service and its APIs. API clients contain methods that either act as a thin wrapper for sending a single request to the API or combine several requests to execute a more complex operation.

This repository contains multiple packages:
- `@itwin/imodels-client-management` is an API client that exposes a subset of iModels API operations and is intended to use in iModel management applications. Such applications do not edit the iModel file itself, they allow user to perform administrative tasks - create Named Versions, view Changeset metadata and such. An example of iTwin management application is the [iTwin Demo Portal](https://itwindemo.bentley.com/).
- `@itwin/imodels-client-authoring` is an API client that extends `@itwin/imodels-client-management` and exposes additional API operations to facilitate iModel editing workflows. This client should not be used directly as the operations it exposes can only be used meaningfully via [iTwin.js](https://www.itwinjs.org/) library.
- `@itwin/imodels-client-common-config` package is used internally to share common configuration across the API clients.
- `@itwin/imodels-clients-tests` package is used internally for API client testing.

## Usage examples

### Get all project iModels
```typescript
import { Authorization, iModelsClient, MinimaliModel } from "@itwin/imodels-client-management";

/** Function that queries all iModels for a particular project and prints their ids to the console. */
async function printiModelIds(): Promise<void> {
  const imodelsClient: iModelsClient = new iModelsClient();
  const imodelIterator: AsyncIterableIterator<MinimaliModel> = imodelsClient.iModels.getMinimalList({
    authorization: () => getAuthorization(),
    urlParams: {
      projectId: "8a1fcd73-8c23-460d-a392-8b4afc00affc"
    }
  });

  for await (const imodel of imodelIterator)
    console.log(imodel.id);
}

/** Function that returns valid authorization information. */
async function getAuthorization(): Promise<Authorization> {
  return { scheme: "Bearer", token: "ey..." };
}
```

### Get all iModel Changesets
```typescript
import { Authorization, iModelsClient, MinimalChangeset } from "@itwin/imodels-client-management";

/** Function that queries all Changesets for a particular iModel and prints their ids to the console. */
async function printChangesetIds(): Promise<void> {
  const imodelsClient: iModelsClient = new iModelsClient();
  const changesetIterator: AsyncIterableIterator<MinimalChangeset> = imodelsClient.Changesets.getMinimalList({
    authorization: () => getAuthorization(),
    imodelId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc"
  });

  for await (const changeset of changesetIterator)
    console.log(changeset.id);
}
```

### Create a Named Version on a Changeset
```typescript
import { Authorization, iModelsClient, NamedVersion } from "@itwin/imodels-client-management";

/** Function that creates a Named Version on a particular changeset and prints its id to the console. */
async function createNamedVersion(): Promise<void> {
  const imodelsClient: iModelsClient = new iModelsClient();
  const namedVersion: NamedVersion = await imodelsClient.NamedVersions.create({
    authorization: () => getAuthorization(),
    imodelId: "30c8505e-fa7a-4b53-a13f-e6a193da8ffc",
    namedVersionProperties: {
      name: "Milestone",
      changesetId: "bd51c08eb44f40d49fee9a0c7d6fc018c3b5ba3f"
    }
  });

  console.log(namedVersion.id);
}
```

