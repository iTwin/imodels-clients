/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Application, CollectionResponse, Link } from "../CommonInterfaces";

/** Possible Named Version states. */
export enum NamedVersionState {
  /** Visible. Named Version should be present in displayed Named Version lists. */
  Visible = "visible",
  /** Hidden. Named Version is intended to be hidden in displayed Named Version lists. */
  Hidden = "hidden"
}

/** Minimal representation of a Named Version. */
export interface MinimalNamedVersion {
  /** Named Version id. */
  id: string;
  /** Named Version display name. Value corresponds to {@link NamedVersion.name} property. */
  displayName: string;
  /**
   * Changeset id that the Named Version is created on. If the value is `null` the Named Version is created on iModel
   * baseline (before any Changesets). Points to the same Changeset as {@link MinimalNamedVersion.changesetIndex} property.
   */
  changesetId: string | null;
  /**
   * Changeset index that the Named Version is created on. If the value is `0` the Named Version is created on iModel
   * baseline (before any Changesets). Points to the same Changeset as {@link MinimalNamedVersion.changesetId} property.
   */
  changesetIndex: number;
}

/** Links that belong to Named Version entity. */
export interface NamedVersionLinks {
  /** Link to the User which created the Named Version. Link points to a specific User in iModels API. */
  creator: Link | null;
  /** Link to the Changeset on which the Named Version was created. Link points to a specific Changeset in iModels API. */
  changeset: Link | null;
}

/** Full representation of a Named Version. */
export interface NamedVersion extends MinimalNamedVersion {
  /** Named Version name. Value corresponds to {@link MinimalNamedVersion.displayName} property. */
  name: string;
  /** Named Version description. */
  description: string | null;
  /** Datetime string of when the Named Version was created. */
  createdDateTime: string;
  /**
   * Named Version state. This property indicates whether or not this Named Version should be displayed in
   * applications that show full Named Version list to end users. Named Versions with state equal to
   * `NamedVersionState.Hidden` are present in the Named Version list returned by the API. See {@link NamedVersionState}.
   */
  state: NamedVersionState;
  /** Information about the application that created the Named Version. */
  application: Application | null;
  /** Named Version links. See {@link NamedVersionLinks}. */
  _links: NamedVersionLinks;
}

/** DTO to hold a single Named Version API response. */
export interface NamedVersionResponse {
  namedVersion: NamedVersion;
}

/** DTO to hold Named Version list API response. */
export interface NamedVersionsResponse<TNamedVersion extends MinimalNamedVersion> extends CollectionResponse {
  namedVersions: TNamedVersion[];
}
