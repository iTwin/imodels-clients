/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BaseEntity, CollectionResponse } from "../CommonInterfaces";

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

export type MinimaliModel = BaseEntity

export interface iModel extends MinimaliModel {
  name: string;
  description?: string;
  state: iModelState;
  createdDateTime: Date;
  projectId: string;
  extent?: Extent;
}

export interface iModelResponse {
  iModel: iModel;
}

export interface iModelsResponse<TiModel extends MinimaliModel> extends CollectionResponse {
  iModels: TiModel[];
}
