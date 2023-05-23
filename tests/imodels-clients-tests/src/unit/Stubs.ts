/* eslint-disable @typescript-eslint/no-unused-vars */
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// cspell:ignore StubbableType
import * as sinon from "sinon";

export function createStub<T>(
  constructor: sinon.StubbableType<T> & { prototype: T }
): sinon.SinonStubbedInstance<T> {
  return sinon.createStubInstance(constructor);
}
