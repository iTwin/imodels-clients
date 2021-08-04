/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity } from "../PublicModels";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Extent {
  southWest: Coordinates;
  northEast: Coordinates;
}

export interface MinimaliModel extends BaseEntity {

}

export interface iModel extends MinimaliModel {
  name: string;
  description?: string;
  initialized: boolean;
  createdDateTime: Date;
  projectId: string;
  extent?: Extent;
}
