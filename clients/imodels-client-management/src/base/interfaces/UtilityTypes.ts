/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityCollectionPage } from "./CommonInterfaces";

export interface Dictionary<T> { [key: string]: T }

export type RecursiveRequired<T> = Required<T> & { [P in keyof T]: RecursiveRequired<T[P]>; };
export type EntityPageQueryFunc<TEntity> = () => Promise<EntityCollectionPage<TEntity>>;
export type AtLeastOneProperty<T> = { [P in keyof T]: Pick<T, P> }[keyof T];
