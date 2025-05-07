/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Changeset Extended Data. */
export interface ChangesetExtendedData {
  /** Changeset id. */
  changesetId: string;
  /** Changeset index. */
  changesetIndex: number;
  /** Changeset application specific data. */
  data: object;
}
