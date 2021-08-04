/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { APIEntity, Link } from "../PublicModels";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Extent {
  southWest: Coordinates;
  northEast: Coordinates;
}

export interface iModelLinks {
  creator: Link;
  changesets: Link;
  namedVersions: Link;
}

export interface MinimaliModel extends APIEntity {

}

export interface iModel extends MinimaliModel {
  name: string;
  description?: string;
  initialized: boolean;
  createdDateTime: Date;
  projectId: string;
  extent?: Extent;
  _links: iModelLinks;
}