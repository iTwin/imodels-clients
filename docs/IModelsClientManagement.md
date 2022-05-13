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
  - [`getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L17)
  - [`getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L33)
  - [`getSingle(params: GetSingleIModelParams): Promise<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L48)
  - [`createEmpty(params: CreateEmptyIModelParams): Promise<IModel>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L)
  - [`delete(params: DeleteIModelParams): Promise<void>`](../clients/imodels-client-management/src/operations/imodel/IModelOperations.ts#L)
- [`IModelsClient.briefcases`](../clients/imodels-client-management/src/IModelsClient.ts#L49)
  - [`getMinimalList(params: GetBriefcaseListParams): EntityListIterator<MinimalBriefcase> `](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L19)
  - [`getRepresentationList(params: GetBriefcaseListParams): EntityListIterator<Briefcase>`](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L36)
  - [`getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase>`](../clients/imodels-client-management/src/operations/briefcase/BriefcaseOperations.ts#L52)
- [`IModelsClient.changesets`](../clients/imodels-client-management/src/IModelsClient.ts#L54)
  - [`getMinimalList(params: GetChangesetListParams): EntityListIterator<MinimalChangeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L30)
  - [`getRepresentationList(params: GetChangesetListParams): EntityListIterator<Changeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L48)
  - [`getSingle(params: GetSingleChangesetParams): Promise<Changeset>`](../clients/imodels-client-management/src/operations/changeset/ChangesetOperations.ts#L70)
- [`IModelsClient.namedVersions`](../clients/imodels-client-management/src/IModelsClient.ts#L59)
  - [`getMinimalList(params: GetNamedVersionListParams): EntityListIterator<MinimalNamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L19)
  - [`getRepresentationList(params: GetNamedVersionListParams): EntityListIterator<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L37)
  - [`getSingle(params: GetSingleNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L53)
  - [`create(params: CreateNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L68)
  - [`update(params: UpdateNamedVersionParams): Promise<NamedVersion>`](../clients/imodels-client-management/src/operations/named-version/NamedVersionOperations.ts#L85)
- [`IModelsClient.checkpoints`](../clients/imodels-client-management/src/IModelsClient.ts#L64)
  - [`getSingle(params: GetSingleCheckpointParams): Promise<Checkpoint>`](../clients/imodels-client-management/src/operations/checkpoint/CheckpointOperations.ts#L19)
