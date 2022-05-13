# `@itwin/imodels-client-authoring`

`IModelsClient` exposed by `@itwin/imodels-client-authoring` package extends `IModelsClient` exposed by `@itwin/imodels-client-management` package so this documentation references sections from [`@itwin/imodels-client-management` documentation](IModelsClientManagement.md). All types mentioned there are also exported from `@itwin/imodels-client-authoring` package.

## Key types
- [`IModelsClient`](../clients/imodels-client-authoring/src/IModelsClient.ts#L31)
- [`IModelsClientOptions`](../clients/imodels-client-authoring/src/IModelsClient.ts#L18)

### Parameter and response types
Please see [parameter and response types for `@itwin/imodels-client-management`](./IModelsClientManagement.md#parameter-and-response-types)

Additional types:
- [`TargetDirectoryParam`](../clients/imodels-client-authoring/src/base/interfaces/CommonInterfaces.ts#13)

### Entities
Please see [entities for `@itwin/imodels-client-management`](./IModelsClientManagement.md#entities)

Additional types:
- [`Lock`](../clients/imodels-client-authoring/src/base/interfaces/apiEntities/LockInterfaces.ts#L25)

## Key methods
Please see [key methods for `@itwin/imodels-client-management`](./IModelsClientManagement.md#key-methods)

Additional methods:
- [`IModelsClient.iModels`](../clients/imodels-client-authoring/src/IModelsClient.ts#L)
  - [`createFromBaseline(params: CreateIModelFromBaselineParams): Promise<IModel>`](../clients/imodels-client-authoring/src/operations/imodel/IModelOperations.ts#L33)
- [`IModelsClient.briefcases`](../clients/imodels-client-authoring/src/IModelsClient.ts#L)
  - [`acquire(params: AcquireBriefcaseParams): Promise<Briefcase>`](../clients/imodels-client-authoring/src/operations/briefcase/BriefcaseOperations.ts#L17)
  - [`release(params: ReleaseBriefcaseParams): Promise<void>`](../clients/imodels-client-authoring/src/operations/briefcase/BriefcaseOperations.ts#L34)
- [`IModelsClient.changesets`](../clients/imodels-client-authoring/src/IModelsClient.ts#L)
  - [`create(params: CreateChangesetParams): Promise<Changeset>`](../clients/imodels-client-authoring/src/operations/changeset/ChangesetOperations.ts#L20)
  - [`downloadSingle(params: DownloadSingleChangesetParams): Promise<DownloadedChangeset>`](../clients/imodels-client-authoring/src/operations/changeset/ChangesetOperations.ts#L49)
  - [`downloadList(params: DownloadChangesetListParams): Promise<DownloadedChangeset[]>`](../clients/imodels-client-authoring/src/operations/changeset/ChangesetOperations.ts#L65)
- [`IModelsClient.locks`](../clients/imodels-client-authoring/src/IModelsClient.ts#L)
  - [`getList(params: GetLockListParams): EntityListIterator<Lock>`](../clients/imodels-client-authoring/src/operations/lock/LockOperations.ts#L19)
  - [`update(params: UpdateLockParams): Promise<Lock>`](../clients/imodels-client-authoring/src/operations/lock/LockOperations.ts#L34)