/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityCollectionPage } from "./interfaces/CommonInterfaces";
import { EntityPageQueryFunc } from "./interfaces/UtilityTypes";

export async function* getPagedCollectionGenerator<TEntity>(pageQueryFunc: EntityPageQueryFunc<TEntity>): AsyncIterableIterator<TEntity> {
  let nextPageQueryFunc: EntityPageQueryFunc<TEntity> | undefined = pageQueryFunc;

  while (nextPageQueryFunc) {
    const entityPage: EntityCollectionPage<TEntity> = await nextPageQueryFunc();
    nextPageQueryFunc = entityPage.next;

    for (const entity of entityPage.entities)
      yield entity;
  }
}
