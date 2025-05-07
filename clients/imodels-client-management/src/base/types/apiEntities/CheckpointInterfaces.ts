/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { StorageLink } from "../CommonInterfaces";

/** Possible Checkpoint states. */
export enum CheckpointState {
  /** Checkpoint generation completed successfully. */
  Successful = "successful",
  /** Checkpoint generation is not yet complete, the background job is scheduled. */
  Scheduled = "scheduled",
  /** Checkpoint generation failed. */
  Failed = "failed",
  /** Checkpoint is not generated and the background job is not scheduled. */
  NotGenerated = "notGenerated",
}

export interface AzureDirectoryAccessInfo {
  /** Shared access key to access the container. */
  sasToken: string;
}

export interface GoogleDirectoryAccessInfo {
  /** Shared access key to access the container. */
  authorization: string;
}

/** Storage container which stores the Checkpoint in blocks. */
export interface DirectoryAccessInfo {
  /** Base URL to the storage. */
  baseUrl: string;
  /** Storage account name. */
  storage: string;
  /** Base directory name. */
  baseDirectory: string;
  /** Type of storage for container */
  storageType: string;
  /** Access information for Azure storage. */
  azure?: AzureDirectoryAccessInfo;
  /** Access information for Google storage. */
  google?: GoogleDirectoryAccessInfo;
}

/** Links that belong to Checkpoint entity. */
export interface CheckpointLinks {
  /** Link to download the Checkpoint file. Points to file storage. */
  download: StorageLink | null;
}

/** Full representation of a Checkpoint. */
export interface Checkpoint {
  /**
   * Changeset id that the Checkpoint is generated on. Points to the same Changeset as {@link Checkpoint.changesetIndex}
   * property.
   */
  changesetId: string;
  /**
   * Changeset index that the Checkpoint is generated on. Points to the same Changeset as {@link Checkpoint.changesetId}
   * property.
   */
  changesetIndex: number;
  /** Checkpoint state. See {@link CheckpointState}. */
  state: CheckpointState;
  /** Name of checkpoint when downloading it in blocks. */
  dbName: string;
  /** Information to access storage container which stores the Checkpoint in blocks. See {@link DirectoryAccessInfo}. */
  directoryAccessInfo: DirectoryAccessInfo | null;
  /** Checkpoint links. See {@link CheckpointLinks}. */
  _links: CheckpointLinks;
}
