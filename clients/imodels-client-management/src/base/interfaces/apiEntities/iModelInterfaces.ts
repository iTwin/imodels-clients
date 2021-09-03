/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity, CollectionResponse, Link } from "../CommonInterfaces";

export enum iModelState {
  Initialized = "initialized",
  NotInitialized = "notInitialized",
}

export interface Point {
  latitude: number;
  longitude: number;
}

export interface Extent {
  southWest: Point;
  northEast: Point;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MinimaliModel extends BaseEntity {

}

export interface iModel extends MinimaliModel {
  name: string;
  description?: string;
  state: iModelState;
  createdDateTime: Date;
  projectId: string;
  extent?: Extent;
}

export interface iModelLinks {
  upload: Link;
  complete: Link;
}

export interface iModelResponse {
  imodel: iModel & { _links: iModelLinks };
}

export interface iModelsResponse<TiModel> extends CollectionResponse {
  imodels: TiModel[];
}
