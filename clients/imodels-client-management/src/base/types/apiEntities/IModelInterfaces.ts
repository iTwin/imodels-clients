/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link, StorageLink } from "../CommonInterfaces";

import { User } from "./UserInterfaces";

/** Possible iModel states. */
export enum IModelState {
  /**
   * Not initialized iModel. iModel is not yet initialized and the server-side background initialization
   * process is still running. Initialization could take several minutes.
   */
  NotInitialized = "notInitialized",
  /** Initialized iModel. It means that iModel initialization has completed and iModel is ready to use. */
  Initialized = "initialized",
}

/** A point on the Earth's surface denoted by coordinates. Used to specify {@link Extent}. */
export interface Point {
  /** Latitude. Values range from -90 to 90. */
  latitude: number;
  /** Longitude. Value range from -180 to 180. */
  longitude: number;
}

/** A flag enum used to specify which containers are enabled for the iModel. */
export enum ContainerTypes {
  None = 0,
  SchemaSync = 1 << 0,
  CodeStore = 1 << 1,
  ViewStore = 1 << 2,
}

/**
 * The maximum rectangular area on the Earth which encloses the iModel. The maximum extent is used to help keep your
 * iModel clean. When new elements are imported, those outside the extent will be flagged for further processing. This
 * extent will also help to zoom to the area of interest in web viewers.
 */
export interface Extent {
  /** South Latitude, West Longitude. */
  southWest: Point;
  /** North Latitude, East Longitude. */
  northEast: Point;
}

/** The GeographicCoordinateSystem is used to determine how to spatially locate the iModel on the Earth's surface. */
export interface GeographicCoordinateSystem {
  /** A string identifier corresponding to a horizontal Coordinate Reference System in iTwin.js. */
  horizontalCRSId: string;
}

/**
 * The mode of iModel creation.
 */
export type IModelCreationMode = "empty" | "fromIModelVersion" | "fromBaseline";

/** Minimal representation of an iModel. */
export interface MinimalIModel {
  /** iModel id. */
  id: string;
  /** iModel display name. Corresponds to {@link IModel.name} property. */
  displayName: string;
}

/** Links that belong to iModel entity returned from iModels API. */
export interface IModelLinks {
  /**
   * Link where to upload the iModel Baseline file. Link points to a remote storage. IMPORTANT: this link
   * is never present in any of the IModel instances returned from methods in this client. This property is
   * only used internally.
   * @private
   */
  upload: StorageLink | null | undefined;
  /**
   * Link to confirm the Baseline file upload and complete the iModel creation process. Points to a specific
   * iModel Baseline in iModels API. IMPORTANT: this link is never present in any of the IModel instances
   * returned from methods in this client. This property is only used internally.
   * @private
   */
  complete: Link | null | undefined;
  /** Link to the User who created the baseline file instance. Link points to a specific User in iModels API. */
  creator: Link | null;
  /** Link to retrieve iModel Changesets. Link points to Changeset collection in iModels API. */
  changesets: Link | null;
  /** Link to retrieve iModel Named Versions. Link points to Named Version collection in iModels API. */
  namedVersions: Link | null;
}

/** Full representation of an iModel. */
export interface IModel extends MinimalIModel {
  /** iModel name. */
  name: string;
  /** iModel description. */
  description: string | null;
  /** iModel state. See {@link iModelState}.*/
  state: IModelState;
  /** Datetime string of when the iModel was created. */
  createdDateTime: string;
  /** Id of the iTwin that the iModel belongs to. */
  iTwinId: string;
  /** iModel extent. See {@link Extent}. */
  extent: Extent | null;
  /** iModel container types. See {@link ContainerTypes}. */
  containersEnabled: ContainerTypes;
  /** The data center where the data for the iModel is persisted. */
  dataCenterLocation: string;
  /** iModel links. See {@link IModelLinks}.*/
  _links: IModelLinks;
  /**
   * Function to query User who created this iModel. If this information is unavailable the
   * function returns `undefined`. This function reuses authorization information passed to specific iModel
   * operation that originally queried the iModel from API.
   */
  getCreator: () => Promise<User | undefined>;
}
