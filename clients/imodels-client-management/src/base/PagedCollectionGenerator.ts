/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityCollectionPage } from "./interfaces/CommonInterfaces";
import { EntityPageQueryFunc } from "./interfaces/UtilityTypes";

export function getCollectionIterator<TEntity>(pageQueryFunc: EntityPageQueryFunc<TEntity>): AsyncIterableIterator<TEntity> {
  return flatten(getCollectionPagesIterator(pageQueryFunc));
}

export async function* getCollectionPagesIterator<TEntity>(pageQueryFunc: EntityPageQueryFunc<TEntity>): AsyncIterableIterator<TEntity[]> {
  let nextPageQueryFunc: EntityPageQueryFunc<TEntity> | undefined = pageQueryFunc;

  while (nextPageQueryFunc) {
    const entityPage: EntityCollectionPage<TEntity> = await nextPageQueryFunc();
    nextPageQueryFunc = entityPage.next;
    yield entityPage.entities;
  }
}

export async function* map<TSource, TTarget>(iterator: AsyncIterableIterator<TSource>, mapFunc: (entity: TSource) => TTarget): AsyncIterableIterator<TTarget> {
  for await (const entity of iterator)
    yield mapFunc(entity);
}

export async function* flatten<TEntity>(pagedIterator: AsyncIterableIterator<TEntity[]>): AsyncIterableIterator<TEntity> {
  for await (const entityChunk of pagedIterator)
    for (const entity of entityChunk)
      yield entity;
}

export async function toArray<TEntity>(iterator: AsyncIterableIterator<TEntity>): Promise<TEntity[]> {
  const result: TEntity[] = [];
  for await (const entity of iterator)
    result.push(entity);

  return result;
}
