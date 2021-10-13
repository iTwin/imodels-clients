/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link } from "@itwin/imodels-client-management";

export enum CheckpointState {
  Successful = "successful",
  Scheduled = "scheduled",
  Failed = "failed",
  NotGenerated = "notGenerated"
}

export interface ContainerAccessKey {
  account: string;
  sas: string;
  container: string;
  dbName: string;
}

export interface CheckpointLinks {
  download: Link;
}

export interface Checkpoint {
  changesetIndex: number;
  changesetId: string;
  state: CheckpointState;
  containerAccessKey: ContainerAccessKey;
  _links?: CheckpointLinks;
}

export interface CheckpointResponse {
  checkpoint: Checkpoint;
}
