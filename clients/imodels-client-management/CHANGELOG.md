# Change Log - @itwin/imodels-client-management

This log was last generated on Tue, 18 Jun 2024 09:48:03 GMT and should not be manually modified.

## 5.7.0
Tue, 18 Jun 2024 09:48:03 GMT

### Minor changes

- Add `forkedFrom` response property in `CreateIModelOperationDetails`.
- Add fork iModel operation.
- Add `containersEnabled` property.
- Fix consumer provided `timeOutInMs` not being respected in iModel operations.
- Add Named Version `$search` query parameter.
- Add iModel `$search` query parameter.
- Add HTTP status code to iModelsError.
- Add Changeset Extended Data operations.
- Add ordering by `createdDateTime` for Named Versions.
- Add ordering by `acquiredDateTime` for Briefcases.
- Add latest checkpoint link to Briefcase entity
- Add Get Briefcase Checkpoint operation

## 5.0.0
Thu, 4 Apr 2024 13:39:29 GMT

### Breaking changes

- Update `RestClient` interface. Classes implementing `RestClient` interface must now return HTTP response headers in addition to the response body.
- Update `createFromTemplate` iModel operation error handling. If iModel initialization times out, the error code of the thrown error will now be `IModelFromTemplateInitializationTimedOut` instead of `IModelFromTemplateInitializationFailed`.

## 4.0.0
Tue, 23 May 2023 15:57:54 GMT

### Breaking changes

- Drop support for Node.js versions older than 18.12.0.

## 3.0.0
Thu, 23 Feb 2023 16:27:30 GMT

### Breaking changes

- Update client to use [iModels API V2](https://developer.bentley.com/apis/imodels-v2/overview/) by default. All references to the term 'Project' were updated to use 'iTwin' (`projectId` -> `iTwinId`, ...).

## 2.0.0
Fri, 22 July 2022 14:42:36 GMT

### Breaking changes

- Remove `FileHandler` interface and default `AzureFileHandler` implementation. Storage operations now use [`@itwin/object-storage-core`](https://www.npmjs.com/package/@itwin/object-storage-core) and [`@itwin/object-storage-azure`](https://www.npmjs.com/package/@itwin/object-storage-azure) packages.
- Remove internal code exports from the main `index.ts` file that should not be used directly by package users. The following components are no longer part of the public package API: 
  - Operation classes (`IModelOperations`, `ChangesetOperations`, etc.) 
  - Utility types (raw API response interfaces, etc.) 
  - Default IModelsClient option implementations (`AxiosRestClient`) 
  - Default iModels API parser class
- Change `_links` property type in entity interfaces from `Link` to `Link | null` as per iModels API definition.

### Minor changes

- Surface more iModels API operations. Please see the package documentation for an updated list of supported operations and entities: [link to docs](https://github.com/iTwin/imodels-clients/blob/main/docs/IModelsClientAuthoring.md).

## 1.0.0
Tue, 18 Jan 2022 14:44:04 GMT

_Initial release_

