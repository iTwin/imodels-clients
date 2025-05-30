/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Application, Link, StorageLink } from "../CommonInterfaces";

import { Checkpoint } from "./CheckpointInterfaces";
import { NamedVersion } from "./NamedVersionInterfaces";
import { User } from "./UserInterfaces";

/** Possible Changeset states. */
export enum ChangesetState {
  /** Changeset instance is created but file is not uploaded. The Changeset creation is not complete. */
  WaitingForFile = "waitingForFile",
  /** The Changeset file is uploaded and creation is complete. */
  FileUploaded = "fileUploaded",
}

/** Flags that describe Changeset contents. */
export enum ContainingChanges {
  Regular = 0,
  Schema = 1 << 0,
  Definition = 1 << 1,
  SpatialData = 1 << 2,
  SheetsAndDrawings = 1 << 3,
  ViewsAndModels = 1 << 4,
  GlobalProperties = 1 << 5,
  SchemaSync = 1 << 6,
}

/** Synchronization information. */
export interface SynchronizationInfo {
  /** Id of the synchronization task. */
  taskId: string;
  /** List of files that were processed by the synchronization. */
  changedFiles: string[] | null;
}

/** Links that belong to minimal Changeset entity returned from iModels API. */
export interface MinimalChangesetLinks {
  /** Link to the current Changeset entity. */
  self: Link | null;
  /** Link to the User which created the Changeset. Link points to a specific User in iModels API. */
  creator: Link | null;
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
  /** Id of the parent Changeset. Equals to empty string if the Changeset is first in sequence. */
  parentId: string;
  /** Id of the user who created the Changeset. */
  creatorId: string;
  /** Datetime string of when the Changeset was created. */
  pushDateTime: string;
  /** Changeset state. See {@link ChangesetState}. */
  state: ChangesetState;
  /** Describes what type of changes the Changeset contains. See {@link ContainingChanges}. */
  containingChanges: ContainingChanges;
  /** Size of the Changeset file in bytes. */
  fileSize: number;
  /** Id of the Briefcase that was used to create the Changeset. */
  briefcaseId: number;
  /**
   * Id of the Changeset Group that the Changeset belongs to.
   * `null` if the Changeset does not belong to a Changeset Group.
   */
  groupId: string | null;
  /** Changeset links. See {@link MinimalChangesetLinks}. */
  _links: MinimalChangesetLinks;
  /**
   * Function to query User who created the Changeset. If the information is not present the
   * function returns `undefined`. This function reuses authorization information passed to specific Changeset
   * operation that originally queried the Changeset from API.
   */
  getCreator: () => Promise<User | undefined>;
}

/** Links that belong to Changeset entity returned from iModels API. */
export interface ChangesetLinks extends MinimalChangesetLinks {
  /** Link to a Named Version created on the Changeset. Points to a specific Named Version in iModels API. */
  namedVersion: Link | null;
  /**
   * Link to a Checkpoint that is created on a current or preceding Changeset. Points to a specific Checkpoint
   * in iModels API.
   * */
  currentOrPrecedingCheckpoint: Link | null;
  /** Link from where to download the Changeset file. Link points to a remote storage. */
  download: StorageLink | null;
  /**
   * Link where to upload the Changeset file. Link points to a remote storage. IMPORTANT: this link
   * is never present in any of the Changeset instances returned from methods in this client. This property
   * is only used internally.
   */
  upload: StorageLink | null | undefined;
  /**
   * Link to confirm the Changeset file upload and complete the creation process. Points to a specific
   * Changeset in iModels API. IMPORTANT: this link is never present in any of the Changeset instances returned
   * from methods in this client. This property is only used internally.
   */
  complete: Link | null | undefined;
}

/** Full representation of a Changeset. */
export interface Changeset extends MinimalChangeset {
  /** Information about the application that created the Changeset. */
  application: Application | null;
  /** Information about synchronization process that created the Changeset. */
  synchronizationInfo: SynchronizationInfo | null;
  /** Changeset links. See {@link ChangesetLinks}. */
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
