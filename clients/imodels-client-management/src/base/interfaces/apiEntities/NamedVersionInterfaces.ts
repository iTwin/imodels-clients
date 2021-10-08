/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity, CollectionResponse } from "../CommonInterfaces";

export enum NamedVersionState {
  Visible = "visible",
  Hidden = "hidden"
}

export interface MinimalNamedVersion extends BaseEntity {
  changesetId?: string;
}

export interface NamedVersion extends MinimalNamedVersion {
  name: string;
  description?: string;
  createdDateTime: Date;
  state: NamedVersionState;
}

export interface NamedVersionResponse {
  namedVersion: NamedVersion;
}

export interface NamedVersionsResponse<TNamedVersion extends MinimalNamedVersion> extends CollectionResponse {
  namedVersions: TNamedVersion[];
}