/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIterator, flatten } from "../../public";
import { EntityPageQueryFunc } from "../UtilityTypes";

import { EntityPageListIterator } from "./EntityPageListIterator";

export class EntityListIteratorImpl<TEntity> implements EntityListIterator<TEntity> {
  private _entityPages: EntityPageListIterator<TEntity>;
  private _entities: AsyncIterableIterator<TEntity>;

  constructor(pageQueryFunc: EntityPageQueryFunc<TEntity>) {
    this._entityPages = new EntityPageListIterator(pageQueryFunc);
    this._entities = flatten(this._entityPages);
  }

  public [Symbol.asyncIterator](): AsyncIterableIterator<TEntity> {
    return this;
  }

  public async next(): Promise<IteratorResult<TEntity>> {
    return this._entities.next();
  }

  public byPage(): AsyncIterableIterator<TEntity[]> {
    return this._entityPages;
  }
}
