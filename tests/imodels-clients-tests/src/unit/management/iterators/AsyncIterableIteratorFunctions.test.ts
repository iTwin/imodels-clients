/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { take, toArray } from "@itwin/imodels-client-management";

class TestEntity {
  constructor(public index: number) {}
}

describe("AsyncIterableIterator utility functions", () => {
  it("should should convert into array", async () => {
    // Arrange
    const elementCount = 5;
    const testIterator = getTestIterator(elementCount);

    // Act
    const entities: TestEntity[] = await toArray(testIterator);

    // Assert
    expect(entities.length).to.equal(elementCount);
    for (let i = 0; i < entities.length; i++)
      expect(entities[i].index).to.equal(i);
  });

  it("should take top n elements", async () => {
    // Arrange
    const testIterator = getTestIterator(5);
    const elementCountToTake = 1;

    // Act
    const entities: TestEntity[] = await take(testIterator, elementCountToTake);

    // Assert
    expect(entities.length).to.equal(elementCountToTake);
    expect(entities[0].index).to.equal(0);
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  async function* getTestIterator(
    count: number
  ): AsyncIterableIterator<TestEntity> {
    for (let i = 0; i < count; i++) yield new TestEntity(i);
  }
});
