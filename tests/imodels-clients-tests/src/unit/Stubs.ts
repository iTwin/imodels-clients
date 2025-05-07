/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// cspell:ignore StubbableType
import * as sinon from "sinon";

export function createStub<T>(
  constructor: sinon.StubbableType<T> & { prototype: T }
): sinon.SinonStubbedInstance<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return sinon.createStubInstance(constructor);
}
