/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "../CommonInterfaces";

export enum IModelState {
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

export interface MinimalIModel {
  id: string;
  displayName: string;
}

export interface IModel extends MinimalIModel {
  name: string;
  description: string | null;
  state: IModelState;
  createdDateTime: string;
  projectId: string;
  extent: Extent | null;
}

export interface IModelResponse {
  IModel: IModel;
}

export interface IModelsResponse<TIModel extends MinimalIModel> extends CollectionResponse {
  IModels: TIModel[];
}
