/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export class LimitedParallelQueue {
  private _queue: Array<() => Promise<void>> = [];
  private _maxParallelPromises;

  constructor(config: { maxParallelPromises: number }) {
    this._maxParallelPromises = config.maxParallelPromises;
  }

  public push(item: () => Promise<void>): void {
    this._queue.push(item);
  }

  public async waitAll(): Promise<void> {
    const currentlyExecutingPromises = new Array<Promise<void>>();
    while (this._queue.length !== 0 || currentlyExecutingPromises.length !== 0) {
      while (this._queue.length !== 0 && currentlyExecutingPromises.length < this._maxParallelPromises) {
        // We create a promise that removes itself from the `currentlyExecutingPromises` queue after it resolves.
        const itemToExecute = this._queue.shift()!;
        const executingItem = itemToExecute().then(() => {
          const indexOfItemInQueue = currentlyExecutingPromises.indexOf(executingItem);
          currentlyExecutingPromises.splice(indexOfItemInQueue, 1);
        });
        currentlyExecutingPromises.push(executingItem);
      }
      await Promise.race(currentlyExecutingPromises);
    }
  }
}
