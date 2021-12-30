/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * Transforms each entity in the async iterator using the provided function.
 * @param {AsyncIterableIterator<TSource>} iterator source entity iterator.
 * @param {(entity: TSource) => TTarget} mapFunc function to transform elements from `TSource` to `TTarget`.
 * @returns {AsyncIterableIterator<TTarget>} iterator of transformed elements.
 */
export async function* map<TSource, TTarget>(
  iterator: AsyncIterableIterator<TSource>,
  mapFunc: (entity: TSource) => TTarget
): AsyncIterableIterator<TTarget> {
  for await (const entity of iterator)
    yield mapFunc(entity);
}

/**
 * Transforms an iterator of entity pages into an iterator of entities.
 * @param {AsyncIterableIterator<TEntity[]>} pagedIterator iterator of entity pages.
 * @returns {AsyncIterableIterator<TEntity>} iterator of entities.
 */
export async function* flatten<TEntity>(pagedIterator: AsyncIterableIterator<TEntity[]>): AsyncIterableIterator<TEntity> {
  for await (const entityChunk of pagedIterator)
    for (const entity of entityChunk)
      yield entity;
}

/**
 * Loads all entities from an iterator into an array.
 * @param {AsyncIterableIterator<TEntity>} iterator entity iterator.
 * @returns {Promise<TEntity[]>} entity array.
 */
export async function toArray<TEntity>(iterator: AsyncIterableIterator<TEntity>): Promise<TEntity[]> {
  const result: TEntity[] = [];
  for await (const entity of iterator)
    result.push(entity);

  return result;
}

/**
 * Loads top n entities from an iterator into an array.
 * @param {AsyncIterableIterator<TSource>} iterator source entity iterator.
 * @param {number} entityCount number of entities to load.
 * @returns {Promise<TEntity[]>} entity array that contains a number of top elements specified. If iterator contains
 * less items than specified in `entityCount` length of the array will be less than `entityCount`. If
 * iterator contains no entities the array will be empty.
 */
export async function take<TEntity>(iterator: AsyncIterableIterator<TEntity>, entityCount: number): Promise<TEntity[]> {
  const result: TEntity[] = [];
  for await (const entity of iterator) {
    result.push(entity);
    if (result.length === entityCount)
      break;
  }

  return result;
}
