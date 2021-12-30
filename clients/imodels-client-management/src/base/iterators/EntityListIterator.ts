/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * Async iterator for a list of entities of type `TEntity`. This interface allows to iterate over all the entities
 * without having to manage individual pages - a request for a new page is sent after the consumer has already
 * iterated over all of the previous entities.
 */
export interface EntityListIterator<TEntity> extends AsyncIterableIterator<TEntity> {
  /**
   * Exposes internal entity pages. This method allows to operate on entity pages instead of a flattened list. Since
   * all entities in the API response are returned as a single page a new request to the API is sent on every iteration
   * so the consumer can act accordingly, for example, show a spinning wheel in the UI while waiting for the page to
   * load.
   * @returns {AsyncIterableIterator<TEntity[]>} an async iterator for entity pages instead of individual entities.
   */
  byPage(): AsyncIterableIterator<TEntity[]>;
}
