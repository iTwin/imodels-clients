/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Generic dictionary with string keys. */
export interface Dictionary<T> {
  [key: string]: T;
}

/** Abstraction for a single entity page returned by the API. */
export interface EntityCollectionPage<TEntity> {
  /** Current page entities. */
  entities: TEntity[];
  /** Function to retrieve the next page of the entities. If `undefined` the current page is last. */
  next?: () => Promise<EntityCollectionPage<TEntity>>;
}

/** Wrapper type that makes all properties of `T` required recursively. */
export type RecursiveRequired<T> = Required<T> & { [P in keyof T]: RecursiveRequired<T[P]>; };
/** Function to query an entity page. */
export type EntityPageQueryFunc<TEntity> = () => Promise<EntityCollectionPage<TEntity>>;
/** Wrapper type that makes all properties in `T` optional except for the one specified. */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
/** Wrapper type that requires at least one property of `T` to be set. */
export type AtLeastOneProperty<T> = { [P in keyof T]: OptionalExceptFor<T, P> }[keyof T];
