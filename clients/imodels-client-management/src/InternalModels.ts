/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel } from "./operations/iModelModels";
import { Link } from "./PublicModels";

export interface iModelResponse {
  iModel: iModel;
}

export interface CollectionLinks {
  self: Link;
  prev?: Link;
  next?: Link;
}

export interface CollectionResponse {
  _links: CollectionLinks;
}

export interface iModelsResponse<TiModel> extends CollectionResponse {
  iModels: TiModel[];
}


export interface EntityCollectionPage<TEntity> {
  entities: TEntity[];
  next?: () => Promise<EntityCollectionPage<TEntity>>;
}

export enum PreferReturn {
  Minimal = "minimal",
  Representation = "representation"
}