/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionResponse } from "../CommonInterfaces";

/** Possible iModel states. */
export enum iModelState {
  /** Not initialized iModel. It means that iModel is not yet initialized and the server-side background initialization process is still running. Initialization usually takes several minutes. */
  NotInitialized = "notInitialized",
  /** Initialized iModel. It means that iModel initialization has completed and iModel is ready use. */
  Initialized = "initialized"
}

/** A point on the Earth's surface denoted by coordinates. Used to specify {@link Extent}. */
export interface Point {
  /** Latitude. */
  latitude: number;
  /** Longitude. */
  longitude: number;
}

/** The maximum rectangular area on the Earth which encloses the iModel. The maximum extent is used to help keep your iModel clean. When new elements are imported, those outside the extent will be flagged for further processing. This extent will also help to zoom to the area of interest in web viewers. */
export interface Extent {
  /** South Latitude, West Longitude. */
  southWest: Point;
  /** North Latitude, East Longitude. */
  northEast: Point;
}

/** Minimal representation of an iModel. */
export interface MinimaliModel {
  /** iModel id. */
  id: string;
  /** iModel display name. Corresponds to {@link iModel.name} property. */
  displayName: string;
}

export interface iModel extends MinimaliModel {
  /** iModel name. */
  name: string;
  /** iModel description. */
  description: string | null;
  /** iModel state. See {@link iModelState}.*/
  state: iModelState;
  /** Datetime string of when the iModel was created. */
  createdDateTime: string;
  /** Project id that the iModel belongs to. */
  projectId: string;
  /** iModel extent. See {@link Extent}. */
  extent: Extent | null;
}

/** DTO for single iModel API response. */
export interface iModelResponse {
  iModel: iModel;
}

/** DTO for iModel list API response. */
export interface iModelsResponse<TiModel extends MinimaliModel> extends CollectionResponse {
  iModels: TiModel[];
}
