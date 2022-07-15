# `@itwin/imodels-client-management`

## Key types
- [`IModelsClient`](../clients/imodels-client-management/src/IModelsClient.ts#L28)
- [`IModelsClientOptions`](../clients/imodels-client-management/src/IModelsClient.ts#L14)

### Parameter and response types
- [`AuthorizationParam`](../clients/imodels-client-management/src/base/public/CommonInterfaces.ts#L38)
- [`EntityListIterator<TEntity>`](../clients/imodels-client-management/src/base/public/iterators/EntityListIterator.ts#L11)

### Entities
- [`MinimalIModel`](../clients/imodels-client-management/src/base/public/apiEntities/IModelInterfaces.ts#L39), [`IModel`](../clients/imodels-client-management/src/base/public/apiEntities/IModelInterfaces.ts#L47)
- [`MinimalBriefcase`](../clients/imodels-client-management/src/base/public/apiEntities/BriefcaseInterfaces.ts#L10), [`Briefcase`](../clients/imodels-client-management/src/base/public/apiEntities/BriefcaseInterfaces.ts#L23)
- [`MinimalChangeset`](../clients/imodels-client-management/src/base/public/apiEntities/ChangesetInterfaces.ts#L47), [`Changeset`](../clients/imodels-client-management/src/base/public/apiEntities/ChangesetInterfaces.ts#L106)
- [`MinimalNamedVersion`](../clients/imodels-client-management/src/base/public/apiEntities/NamedVersionInterfaces.ts#L19), [`NamedVersion`](../clients/imodels-client-management/src/base/public/apiEntities/NamedVersionInterfaces.ts#L45)
- [`Checkpoint`](../clients/imodels-client-management/src/base/public/apiEntities/CheckpointInterfaces.ts#L38)
- [`Thumbnail`](../clients/imodels-client-management/src/base/public/apiEntities/ThumbnailInterfaces.ts#L16)
- [`MinimalUser`](../clients/imodels-client-management/src/base/public/apiEntities/UserInterfaces.ts#L14), [`User`](../clients/imodels-client-management/src/base/public/apiEntities/UserInterfaces.ts#L24)
- [`UserPermissions`](../clients/imodels-client-management/src/base/public/apiEntities/UserPermissionInterfaces.ts#L33)

## Key methods
- [`IModelsClient.iModels`](../clients/imodels-client-management/src/IModelsClient.ts#L45)
  - [`getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L19) ([sample](#get-all-project-imodels))
  - [`getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L35)
  - [`getSingle(params: GetSingleIModelParams): Promise<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L50)
  - [`createEmpty(params: CreateEmptyIModelParams): Promise<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L64)
  - [`delete(params: DeleteIModelParams): Promise<void>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L118)
- [`IModelsClient.briefcases`](../clients/imodels-client-management/src/IModelsClient.ts#L50)
  - [`getMinimalList(params: GetBriefcaseListParams): EntityListIterator<MinimalBriefcase> `](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L30)
  - [`getRepresentationList(params: GetBriefcaseListParams): EntityListIterator<Briefcase>`](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L47)
  - [`getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase>`](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L69)
- [`IModelsClient.changesets`](../clients/imodels-client-management/src/IModelsClient.ts#L55)
  - [`getMinimalList(params: GetChangesetListParams): EntityListIterator<MinimalChangeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L30) ([sample](#get-all-imodel-changesets))
  - [`getRepresentationList(params: GetChangesetListParams): EntityListIterator<Changeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L54)
  - [`getSingle(params: GetSingleChangesetParams): Promise<Changeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L76)
- [`IModelsClient.namedVersions`](../clients/imodels-client-management/src/IModelsClient.ts#L60)
  - [`getMinimalList(params: GetNamedVersionListParams): EntityListIterator<MinimalNamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L30)
  - [`getRepresentationList(params: GetNamedVersionListParams): EntityListIterator<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L48)
  - [`getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L70)
  - [`create(params: CreateNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L86) ([sample](#create-a-named-version-on-a-changeset))
  - [`update(params: UpdateNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L104)
- [`IModelsClient.checkpoints`](../clients/imodels-client-management/src/IModelsClient.ts#L64)
  - [`getSingle(params: GetSingleCheckpointParams): Promise<Checkpoint>`](../clients/imodels-client-management/src/operations/checkpoint/CheckpointOperations.ts#L21)
- [`IModelsClient.thumbnails`](../clients/imodels-client-management/src/IModelsClient.ts#L70)
  - [`download(params: DownloadThumbnailParams): Promise<Thumbnail>`](../clients/imodels-client-management/src/operations/thumbnail/ThumbnailOperations.ts#L27)
  - [`upload(params: UploadThumbnailParams): Promise<void>`](../clients/imodels-client-management/src/operations/thumbnail/ThumbnailOperations.ts#L55)
- [`IModelsClient.users`](../clients/imodels-client-management/src/IModelsClient.ts#L75)
  - [`getMinimalList(params: GetUserListParams): EntityListIterator<MinimalUser>`](../clients/imodels-client-management/src/operations/user/UserOperations.ts#L19)
  - [`getRepresentationList(params: GetUserListParams): EntityListIterator<User>`](../clients/imodels-client-management/src/operations/user/UserOperations.ts#L36)
  - [`getSingle(params: GetSingleUserParams): Promise<User>`](../clients/imodels-client-management/src/operations/user/UserOperations.ts#L52)
- [`IModelsClient.userPermissions`](../clients/imodels-client-management/src/IModelsClient.ts#L80)
  - [`get(params: GetUserPermissionsParams): Promise<UserPermissions>`](../clients/imodels-client-management/src/operations/user-permission/UserPermissionOperations.ts#L22)

## Usage examples

### Authorization

`IModelsClient` expects the authorization info to be passed in a form of an asynchronous callback that returns authorization info. It is a common use case to consume `IModelsClient` in iTwin.js platform based applications which use `IModelApp.getAccessToken` or `IModelHost.getAccessToken` to get the authorization header value returned as a string. The authorization header value specifies the schema and access token e.g. `Bearer ey...`. To convert this value into the format that `IModelsClients` expect users can use `AccessTokenAdapter` class which is exported by both [`@itwin/imodels-access-frontend`](../itwin-platform-access/imodels-access-frontend/src/interface-adapters/AccessTokenAdapter.ts) and [`@itwin/imodels-access-backend`](../itwin-platform-access/imodels-access-backend/src/interface-adapters/AccessTokenAdapter.ts) packages.
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
