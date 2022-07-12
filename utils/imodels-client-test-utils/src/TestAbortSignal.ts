/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AbortSignal } from "@itwin/imodels-client-authoring";

export class TestAbortSignal implements AbortSignal {
  private _listeners = new Array<() => void>();

  public addListener(listener: () => void): () => void {
    this._listeners.push(listener);

    return () => {
      const index = this._listeners.indexOf(listener);
      this._listeners.splice(index, 1);
    }
  }

  public raise() {
    this._listeners.forEach((listener) => listener());
  }
}
