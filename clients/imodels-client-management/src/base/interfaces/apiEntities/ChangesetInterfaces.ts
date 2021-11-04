/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse, Link } from "../CommonInterfaces";
import { Checkpoint } from "./CheckpointInterfaces";
import { NamedVersion } from "./NamedVersionInterfaces";

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
  changedFiles: string[];
}

export interface MinimalChangesetProperties {
  id: string;
  displayName: string;
  description: string;
  index: number;
  parentId: string;
  pushDateTime: Date;
  state: ChangesetState;
  containingChanges: ContainingChanges;
  fileSize: number;
  briefcaseId: number;
}

export interface ChangesetProperties extends MinimalChangesetProperties {
  application: Application | null;
  synchronizationInfo: SynchronizationInfo | null;
}


export interface ChangesetLinksApiModel {
  upload: Link;
  download: Link;
  complete: Link;
  namedVersion?: Link;
  currentOrPrecedingCheckpoint?: Link;
}

export type MinimalChangesetApiModel = MinimalChangesetProperties;

export type ChangesetApiModel = ChangesetProperties & { _links: ChangesetLinksApiModel };

export interface ChangesetResponseApiModel {
  changeset: ChangesetApiModel;
}

export interface MinimalChangesetsResponseApiModel extends CollectionResponse {
  changesets: MinimalChangesetApiModel[];
}

export interface ChangesetsResponseApiModel extends CollectionResponse {
  changesets: ChangesetApiModel[];
}


export interface ChangesetRelationships {
  getNamedVersion?: () => Promise<NamedVersion>;
  getCurrentOrPrecedingCheckpoint?: () => Promise<Checkpoint>;
}

export type MinimalChangeset = MinimalChangesetProperties;

export type Changeset = ChangesetProperties & ChangesetRelationships;



