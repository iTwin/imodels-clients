/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "../CommonInterfaces";

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

export interface MinimaliModel {
  id: string;
  displayName: string;
}

export interface iModel extends MinimaliModel {
  name: string;
  description: string | null;
  state: iModelState;
  createdDateTime: Date;
  projectId: string;
  extent: Extent | null;
}

export interface iModelResponse {
  iModel: iModel;
}

export interface iModelsResponse<TiModel extends MinimaliModel> extends CollectionResponse {
  iModels: TiModel[];
}
