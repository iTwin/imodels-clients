# `@itwin/imodels-client-management`

## Key types
- [`IModelsClient`](../clients/imodels-client-management/src/IModelsClient.ts#L27)
- [`IModelsClientOptions`](../clients/imodels-client-management/src/IModelsClient.ts#L13)

### Parameter and response types
- [`AuthorizationParam`](../clients/imodels-client-management/src/base/interfaces/CommonInterfaces.ts#L38)
- [`EntityListIterator<TEntity>`](../clients/imodels-client-management/src/base/iterators/EntityListIterator.ts#L11)

### Entities
- [`MinimalIModel`](../clients/imodels-client-management/src/base/interfaces/apiEntities/IModelInterfaces.ts#L39), [`IModel`](../clients/imodels-client-management/src/base/interfaces/apiEntities/IModelInterfaces.ts#L47)
- [`MinimalBriefcase`](../clients/imodels-client-management/src/base/interfaces/apiEntities/BriefcaseInterfaces.ts#L8), [`Briefcase`](../clients/imodels-client-management/src/base/interfaces/apiEntities/BriefcaseInterfaces.ts#L15)
- [`MinimalChangeset`](../clients/imodels-client-management/src/base/interfaces/apiEntities/ChangesetInterfaces.ts#L61), [`Changeset`](../clients/imodels-client-management/src/base/interfaces/apiEntities/ChangesetInterfaces.ts#L87)
- [`MinimalNamedVersion`](../clients/imodels-client-management/src/base/interfaces/apiEntities/NamedVersionInterfaces.ts#L16), [`NamedVersion`](../clients/imodels-client-management/src/base/interfaces/apiEntities/NamedVersionInterfaces.ts#L34)
- [`Checkpoint`](../clients/imodels-client-management/src/base/interfaces/apiEntities/CheckpointInterfaces.ts#L38)

## Key methods
- [`IModelsClient.iModels`](../clients/imodels-client-management/src/IModelsClient.ts#L44)
  - [`getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L17) ([sample](#get-all-project-imodels))
  - [`getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L33)
  - [`getSingle(params: GetSingleIModelParams): Promise<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L48)
  - [`createEmpty(params: CreateEmptyIModelParams): Promise<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L)
  - [`delete(params: DeleteIModelParams): Promise<void>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L)
- [`IModelsClient.briefcases`](../clients/imodels-client-management/src/IModelsClient.ts#L49)
  - [`getMinimalList(params: GetBriefcaseListParams): EntityListIterator<MinimalBriefcase> `](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L19)
  - [`getRepresentationList(params: GetBriefcaseListParams): EntityListIterator<Briefcase>`](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L36)
  - [`getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase>`](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L52)
- [`IModelsClient.changesets`](../clients/imodels-client-management/src/IModelsClient.ts#L54)
  - [`getMinimalList(params: GetChangesetListParams): EntityListIterator<MinimalChangeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L30) ([sample](#get-all-imodel-changesets))
  - [`getRepresentationList(params: GetChangesetListParams): EntityListIterator<Changeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L48)
  - [`getSingle(params: GetSingleChangesetParams): Promise<Changeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L70)
- [`IModelsClient.namedVersions`](../clients/imodels-client-management/src/IModelsClient.ts#L59)
  - [`getMinimalList(params: GetNamedVersionListParams): EntityListIterator<MinimalNamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L19)
  - [`getRepresentationList(params: GetNamedVersionListParams): EntityListIterator<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L37)
  - [`getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L53)
  - [`create(params: CreateNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L68) ([sample](#create-a-named-version-on-a-changeset))
  - [`update(params: UpdateNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L85)
- [`IModelsClient.checkpoints`](../clients/imodels-client-management/src/IModelsClient.ts#L64)
  - [`getSingle(params: GetSingleCheckpointParams): Promise<Checkpoint>`](../clients/imodels-client-management/src/operations/checkpoint/CheckpointOperations.ts#L19)

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
