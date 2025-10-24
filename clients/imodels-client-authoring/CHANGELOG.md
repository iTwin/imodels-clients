# Change Log - @itwin/imodels-client-authoring

This log was last generated on Mon, 29 Sep 2025 09:21:51 GMT and should not be manually modified.

## 6.0.2
Mon, 29 Sep 2025 09:21:51 GMT

### Updates

- Fix AbortSignal and retries for changeset downloads

## 6.0.1
Thu, 26 Jun 2025 10:42:19 GMT

_Version update only_

## 6.0.0
Wed, 28 May 2025 07:15:31 GMT

### Breaking changes

- Support google storage
- Export ESM modules
- Remove dependencies on object storage implementations
- Remove reexports from @itwin/imodels-client-management
- Change @itwin/imodels-client-management to be a peer dependency

### Minor changes

- Moved error parsing to OperationsBase
- Update object-storage to 3.0.0
- Drop support for Node.js versions older than 20.9.0.

## 5.10.0
Wed, 26 Mar 2025 11:41:32 GMT

### Minor changes

- Update documentation

## 5.9.0
Wed, 25 Sep 2024 14:09:09 GMT

_Version update only_

## 5.8.2
Mon, 19 Aug 2024 06:58:46 GMT

### Updates

- Add a documentation comment to inform users to not throw errors inside progress callback functions passed to operations that download files.

## 5.8.1
Wed, 14 Aug 2024 14:41:07 GMT

### Updates

- Update dependency to @itwin/object-storage-* and axios packages.

## 5.8.0
Mon, 01 Jul 2024 14:05:44 GMT

### Minor changes

- Add failed HTTP request retry policy.

### Updates

- Add `originalError` property to `IModelsError`

## 5.7.0
Tue, 18 Jun 2024 11:18:40 GMT

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

- Remove internal code exports from the main `index.ts` file that should not be used directly by package users. The following components are no longer part of the public package API: 
  - Operation classes (`IModelOperations`, `ChangesetOperations`, etc.) 
  - Utility types (raw API response interfaces, etc.) 
  - Default IModelsClient option implementations (`AxiosRestClient`) 
  - Default iModels API parser class
- Change `_links` property type in entity interfaces from `Link` to `Link | null` as per iModels API definition.

### Minor changes

- Surface more iModels API operations. Please see the package documentation for an updated list of supported operations and entities: [link to docs](https://github.com/iTwin/imodels-clients/blob/main/docs/IModelsClientAuthoring.md).

## 1.0.0
Tue, 18 Jan 2022 14:43:04 GMT

_Initial release_

