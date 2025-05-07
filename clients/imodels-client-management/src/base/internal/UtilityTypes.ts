/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Abstraction for a single entity page returned by the API. */
export interface EntityCollectionPage<TEntity> {
  /** Current page entities. */
  entities: TEntity[];
  /** Function to retrieve the next page of the entities. If `undefined` the current page is last. */
  next?: () => Promise<EntityCollectionPage<TEntity>>;
}

/** Function to query an entity page. */
export type EntityPageQueryFunc<TEntity> = () => Promise<
  EntityCollectionPage<TEntity>
>;
