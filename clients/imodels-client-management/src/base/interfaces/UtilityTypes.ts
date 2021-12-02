/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface Dictionary<T> {
  [key: string]: T;
}

export interface EntityCollectionPage<TEntity> {
  entities: TEntity[];
  next?: () => Promise<EntityCollectionPage<TEntity>>;
}

export type RecursiveRequired<T> = Required<T> & { [P in keyof T]: RecursiveRequired<T[P]>; };
export type EntityPageQueryFunc<TEntity> = () => Promise<EntityCollectionPage<TEntity>>;
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
export type AtLeastOneProperty<T> = { [P in keyof T]: OptionalExceptFor<T, P> }[keyof T];
