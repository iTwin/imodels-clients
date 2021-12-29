/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link } from "../CommonInterfaces";

/** Possible Checkpoint states. */
export enum CheckpointState {
  /** Checkpoint generation completed successfully. */
  Successful = "successful",
  /** Checkpoint generation is not yet complete, the background job is scheduled. */
  Scheduled = "scheduled",
  /** Checkpoint generation failed. */
  Failed = "failed",
  /** Checkpoint is not generated and the background job is not scheduled. */
  NotGenerated = "notGenerated"
}

/** Storage container which stores the Checkpoint in blocks. */
export interface ContainerAccessInfo {
  /** Storage account name. */
  account: string;
  /** Shared access key to access the container. */
  sas: string;
  /** Storage container name. */
  container: string;
  /** Checkpoint file name. */
  dbName: string;
}

/** Links that belong to Checkpoint entity. */
export interface CheckpointLinks {
  /** Link to download the Checkpoint file. Points to file storage. */
  download: Link;
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
  /** Information to access storage container which stores the Checkpoint in blocks. See {@link ContainerAccessInfo}. */
  containerAccessInfo: ContainerAccessInfo | null;
  /** Checkpoint links. See {@link CheckpointLinks}. */
  _links: CheckpointLinks | null;
}

/** DTO to hold a single Checkpoint API response. */
export interface CheckpointResponse {
  checkpoint: Checkpoint;
}
