/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityCollectionPage, EntityPageQueryFunc } from "../interfaces/UtilityTypes";

export class EntityPageListIterator<TEntity> implements AsyncIterableIterator<TEntity[]> {
  private _entityPages: AsyncIterableIterator<TEntity[]>;

  constructor(pageQueryFunc: EntityPageQueryFunc<TEntity>) {
    this._entityPages = this.queryPages(pageQueryFunc);
  }

  public [Symbol.asyncIterator](): AsyncIterableIterator<TEntity[]> {
    return this;
  }

  public async next(): Promise<IteratorResult<TEntity[]>> {
    return this._entityPages.next();
  }

  private async * queryPages(pageQueryFunc: EntityPageQueryFunc<TEntity>): AsyncIterableIterator<TEntity[]> {
    let nextPageQueryFunc: EntityPageQueryFunc<TEntity> | undefined = pageQueryFunc;

    while (nextPageQueryFunc) {
      const entityPage: EntityCollectionPage<TEntity> = await nextPageQueryFunc();
      nextPageQueryFunc = entityPage.next;
      yield entityPage.entities;
    }
  }
}
