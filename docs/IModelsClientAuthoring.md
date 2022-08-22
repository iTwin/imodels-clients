# `@itwin/imodels-client-authoring`

`@itwin/imodels-client-authoring` package extends `IModelsClient` exposed by `@itwin/imodels-client-management` package thus this documentation references sections from [`@itwin/imodels-client-management` documentation](./IModelsClientManagement.md).

## Key types
- [`IModelsClient`](../clients/imodels-client-authoring/src/IModelsClient.ts#L38)
- [`IModelsClientOptions`](../clients/imodels-client-authoring/src/IModelsClient.ts#L19)

### Parameter and response types
Please see [documentation](./IModelsClientManagement.md#parameter-and-response-types) of parameter and response types for `@itwin/imodels-client-management`.

Additional types:
- [`TargetDirectoryParam`](../clients/imodels-client-authoring/src/base/public/CommonInterfaces.ts#L13)

### Entities
Please see [documentation](./IModelsClientManagement.md#entities) of entities for `@itwin/imodels-client-management`.

Additional types:
- [`BaselineFile`](../clients/imodels-client-authoring/src/base/public/apiEntities/BaselineFileInterfaces.ts#L31)
- [`Lock`](../clients/imodels-client-authoring/src/base/public/apiEntities/LockInterfaces.ts#L25)

## Key methods
Please see [documentation](./IModelsClientManagement.md#key-methods) of key methods for `@itwin/imodels-client-management`.

Additional methods:
- [`IModelsClient.iModels`](../clients/imodels-client-authoring/src/IModelsClient.ts#L38)
  - [`createFromBaseline(params: CreateIModelFromBaselineParams): Promise<IModel>`](../clients/imodels-client-authoring/src/operations/imodel/IModelOperations.ts#L37) ([sample](#create-imodel-from-baseline-file))
- [`IModelsClient.baselineFiles`](../clients/imodels-client-authoring/src/IModelsClient.ts#L70)
  - [`getSingle(params: GetSingleBaselineFileParams): Promise<BaselineFile>`](../clients/imodels-client-authoring/src/operations/baseline-file/BaselineFileOperations.ts#L21)
- [`IModelsClient.briefcases`](../clients/imodels-client-authoring/src/IModelsClient.ts#L75)
  - [`acquire(params: AcquireBriefcaseParams): Promise<Briefcase>`](../clients/imodels-client-authoring/src/operations/briefcase/BriefcaseOperations.ts#L22)
  - [`release(params: ReleaseBriefcaseParams): Promise<void>`](../clients/imodels-client-authoring/src/operations/briefcase/BriefcaseOperations.ts#L40)
- [`IModelsClient.changesets`](../clients/imodels-client-authoring/src/IModelsClient.ts#L80)
  - [`create(params: CreateChangesetParams): Promise<Changeset>`](../clients/imodels-client-authoring/src/operations/changeset/ChangesetOperations.ts#L28)
  - [`downloadSingle(params: DownloadSingleChangesetParams): Promise<DownloadedChangeset>`](../clients/imodels-client-authoring/src/operations/changeset/ChangesetOperations.ts#L65)
  - [`downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]>`](../clients/imodels-client-authoring/src/operations/changeset/ChangesetOperations.ts#L82)
- [`IModelsClient.locks`](../clients/imodels-client-authoring/src/IModelsClient.ts#L85)
  - [`getList(params: GetLockListParams): EntityListIterator<Lock>`](../clients/imodels-client-authoring/src/operations/lock/LockOperations.ts#L24)
  - [`update(params: UpdateLockParams): Promise<Lock>`](../clients/imodels-client-authoring/src/operations/lock/LockOperations.ts#L39)

## Usage examples

Since the `@itwin/imodels-client-authoring` package extends the `@itwin/imodels-client-management` package all [its usage examples](./IModelsClientManagement.md#usage-examples) are valid for the current client as well.

### Authorization

`IModelsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IModelsClient` in iTwin.js platform based applications which use `IModelApp.getAccessToken` or `IModelHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IModelsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@itwin/imodels-access-frontend`](../itwin-platform-access/imodels-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@itwin/imodels-access-backend`](../itwin-platform-access/imodels-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.
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