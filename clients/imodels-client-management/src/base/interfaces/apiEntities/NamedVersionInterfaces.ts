/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "../CommonInterfaces";

export enum NamedVersionState {
  Visible = "visible",
  Hidden = "hidden"
}

export interface MinimalNamedVersion {
  id: string;
  displayName: string;
  changesetId: string | null;
  changesetIndex: number;
}

export interface NamedVersion extends MinimalNamedVersion {
  name: string;
  description: string | null;
  createdDateTime: string;
  state: NamedVersionState;
}

export interface NamedVersionResponse {
  namedVersion: NamedVersion;
}

export interface NamedVersionsResponse<TNamedVersion extends MinimalNamedVersion> extends CollectionResponse {
  namedVersions: TNamedVersion[];
}
