/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity, CollectionResponse } from "../CommonInterfaces";

export enum ChangesetState {
  WaitingForFile = "waitingForFile",
  FileUploaded = "fileUploaded"
}

export enum ContainingChanges {
  Regular           = 0,
  Schema            = 1 << 0,
  Definition        = 1 << 1,
  SpatialData       = 1 << 2,
  SheetsAndDrawings = 1 << 3,
  ViewsAndModels    = 1 << 4,
  GlobalProperties  = 1 << 5
}

export interface Application {
  name: string;
}

export interface SynchronizationInfo {
  changedFiles: string[]; // todo: optional?
}

export interface MinimalChangeset extends BaseEntity {
  description: string;
  index: number;
  parentId?: string;
  pushDateTime: Date;
  state: ChangesetState;
  containingChanges: ContainingChanges;
  fileSize: number;
  briefcaseId: number;
}

export interface Changeset extends MinimalChangeset {
  application?: Application;
  synchronizationInfo?: SynchronizationInfo;
}

export interface ChangesetsResponse<TChangeset> extends CollectionResponse {
  changesets: TChangeset[];
}