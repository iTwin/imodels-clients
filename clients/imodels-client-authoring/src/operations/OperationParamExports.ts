/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export * from "./baseline-file/BaselineFileOperationParams";
export * from "./imodel/IModelOperationParams";
export * from "./briefcase/BriefcaseOperationParams";
export * from "./changeset/ChangesetOperationParams";
export * from "./changeset-extended-data/ChangesetExtendedDataOperationsParams";
export * from "./changeset-group/ChangesetGroupOperationParams";
export * from "./lock/LockOperationParams";

/** @deprecated in 6.2. Import {@link GetLockListParams} directly from `@itwin/imodels-client-management` instead. */
export type { GetLockListParams } from "@itwin/imodels-client-management";
/** @deprecated in 6.2. Import {@link GetLockListUrlParams} directly from `@itwin/imodels-client-management` instead. */
export type { GetLockListUrlParams } from "@itwin/imodels-client-management";
/** @deprecated in 6.2. Import {@link LockLevelFilter} directly from `@itwin/imodels-client-management` instead. */
export type { LockLevelFilter } from "@itwin/imodels-client-management";
/** @deprecated in 6.2. Import {@link ReleaseBriefcaseParams} directly from `@itwin/imodels-client-management` instead. */
export type { ReleaseBriefcaseParams } from "@itwin/imodels-client-management";
