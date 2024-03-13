/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible Create iModel Operation states. */
export enum IModelCreationState {
  /** iModel creation process completed successfully. */
  Successful = "successful",
  /** iModel is being created from a Baseline File and the file upload to file storage has not been completed yet. */
  WaitingForFile = "waitingForFile",
  /** iModel creation process is scheduled or in progress. */
  Scheduled = "scheduled",
  /** iModel creation process failed. */
  Failed = "failed"
}

/** Information about the source iModel of an iModel clone. */
export interface ClonedFrom {
  /** Id of the source iModel. */
  iModelId: string;
  /**
   * Id of the latest source iModel Changeset which was copied to this iModel.
   * This corresponds to the Changeset specified in changesetId or changesetIndex properties when cloning an iModel.
   * If changesetId is an empty string it means that no Changesets were copied from the source iModel to this one, only iModel Baseline.
   */
  changesetId: string;
}

/** Information about iModel creation process. */
export interface CreateIModelOperationDetails {
  /** Indicates the current state of the iModel creation process. See {@link IModelCreationState}. */
  state: IModelCreationState;
  /**
   * Information about the source iModel of an iModel clone (see {@link ClonedFrom}).
   * If the iModel was not created using Clone iModel operation, the value of this property will be `null`.
   */
  clonedFrom: ClonedFrom | null;
}
