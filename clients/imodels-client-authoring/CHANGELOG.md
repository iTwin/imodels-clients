# Change Log - @itwin/imodels-client-authoring 

## 4.0.0

Breaking changes:
- Dropped support for Node.js versions older than 18.12.0.

## 3.0.0

Breaking changes:
- Updated client to use [iModels API V2](https://developer.bentley.com/apis/imodels-v2/overview/) by default. All references to the term "Project" were updated to use "iTwin" (`projectId` -> `iTwinId`, ...).

## 2.0.0

Breaking changes:
- Removed `FileHandler` interface and default `AzureFileHandler` implementation. Storage operations now use [`@itwin/object-storage-core`](https://www.npmjs.com/package/@itwin/object-storage-core) and [`@itwin/object-storage-azure`](https://www.npmjs.com/package/@itwin/object-storage-azure) packages.
- Removed internal code exports from the main `index.ts` file that should not be used directly by package users. The following components are no longer part of the public package API:
  - Operation classes (`IModelOperations`, `ChangesetOperations`, etc.)
  - Utility types (raw API response interfaces, etc.)
  - Default IModelsClient option implementations (`AxiosRestClient`)
  - Default iModels API parser class
- Changed `_links` property type in entity interfaces from `Link` to `Link | null` as per iModels API definition.

Non-breaking changes:
 - Surfaced more iModels API operations. Please see the package documentation for an updated list of supported operations and entities: [link to docs](https://github.com/iTwin/imodels-clients/blob/main/docs/IModelsClientAuthoring.md).
