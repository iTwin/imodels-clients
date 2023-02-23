# Change Log - @itwin/imodels-client-management 

## 3.0.0

Breaking changes:
- Updated client to use [iModels API V2](https://developer.bentley.com/apis/imodels-v2/overview/) by default. All references to the term "Project" were updated to use "iTwin" (`projectId` -> `iTwinId`, ...).

## 2.0.0

Breaking changes:
- Removed internal code exports from the main `index.ts` file that should not be used directly by package users. The following components are no longer part of the public package API:
  - Operation classes (`IModelOperations`, `ChangesetOperations`, etc.)
  - Utility types (raw API response interfaces, etc.)
  - Default IModelsClient option implementations (`AxiosRestClient`)
  - Default iModels API parser class
- Changed `_links` property type in entity interfaces from `Link` to `Link | null` as per iModels API definition.

Non-breaking changes:
 - Surfaced more iModels API operations. Please see the package documentation for an updated list of supported operations and entities: [link to docs](https://github.com/iTwin/imodels-clients/blob/main/docs/IModelsClientManagement.md).
