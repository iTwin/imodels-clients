/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse, Link } from "../CommonInterfaces";
import { Checkpoint } from "./CheckpointInterfaces";
import { NamedVersion } from "./NamedVersionInterfaces";

/** Possible Changeset states. */
export enum ChangesetState {
  /** Changeset instance is created but file is not uploaded. The Changeset creation is not complete. */
  WaitingForFile = "waitingForFile",
  /** The Changeset file is uploaded and creation is complete. */
  FileUploaded = "fileUploaded"
}

/** Flags that describe Changeset contents. */
export enum ContainingChanges {
  Regular = 0,
  Schema = 1 << 0,
  Definition = 1 << 1,
  SpatialData = 1 << 2,
  SheetsAndDrawings = 1 << 3,
  ViewsAndModels = 1 << 4,
  GlobalProperties = 1 << 5
}

/** Application information. */
export interface Application {
  /** Application name. */
  name: string;
}

/** Synchronization information. */
export interface SynchronizationInfo {
  /** List of files that were processed by the synchronization process. */
  changedFiles: string[];
}

/** DTO for links that belong to Changeset entity returned from iModels API. */
export interface ChangesetLinks {
  /** Link to upload the Changeset file. Points to file storage. */
  upload: Link;
  /** Link to download the Changeset file. Points to file storage. */
  download: Link;
  /**
   * Link to confirm the Changeset file upload and complete the creation process. Points to a specific
   * Changeset in iModels API.
   */
  complete: Link;
  /** Link to a Named Version created on the Chageset. Points to a specific Named Version in iModels API. */
  namedVersion?: Link;
  /**
   * Link to a Checkpoint that is created on a current or preceding Changeset. Points to a specific Checkpoint
   * in iModels API.
   * */
  currentOrPrecedingCheckpoint?: Link;
}

/** Minimal representation of a Changeset. */
export interface MinimalChangeset {
  /** Changeset id. */
  id: string;
  /** Changeset display name. */
  displayName: string;
  /** Changeset description. */
  description: string;
  /** Changeset index. */
  index: number;
  /** Changeset parent id. Equals to empty string if the Changeset is first in sequence. */
  parentId: string;
  /** Id of the user who created the Changeset. */
  creatorId: string;
  /** Datetime string of when the Changeset was created, more specifically - when the Changeset instance was created. */
  pushDateTime: string;
  /** Changeset state. See {@link ChangesetState}. */
  state: ChangesetState;
  /** Describes what type of changes the Changeset contains. See {@link ContainingChanges}. */
  containingChanges: ContainingChanges;
  /** Size of the Changeset file in bytes. */
  fileSize: number;
  /** Briefcase id that was used to create the Changeset. */
  briefcaseId: number;
}

/** Full representation of a Changeset. */
export interface Changeset extends MinimalChangeset {
  /** Information about the application that created the Changeset. */
  application: Application | null;
  /** Information about synchronization process that created the Changeset. */
  synchronizationInfo: SynchronizationInfo | null;
  /** Changeset links. */
  _links: ChangesetLinks;
  /**
   * Function to query Named Version for the current Changeset. If the Changeset does not have a Named Version the
   * function returns `undefined`. This function reuses authorization information passed to specific Changeset
   * operation that originally queried the Changeset from API.
   */
  getNamedVersion: () => Promise<NamedVersion | undefined>;
  /**
   * Function to query Checkpoint for the current or preceding Changeset. If neither the current Changeset nor any of
   * the preceding ones have a Checkpoint generated the function returns `undefined`. This function reuses authorization
   * information passed to specific Changeset operation that originally queried the Changeset from API.
   */
  getCurrentOrPrecedingCheckpoint: () => Promise<Checkpoint | undefined>;
}

/** DTO for single Changeset API response. */
export interface ChangesetResponse {
  changeset: Changeset;
}

/** DTO for minimal Changeset list API response. */
export interface MinimalChangesetsResponse extends CollectionResponse {
  changesets: MinimalChangeset[];
}

/** DTO for representation Changeset list API response. */
export interface ChangesetsResponse extends CollectionResponse {
  changesets: Changeset[];
}
