/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { take, toArray } from "@itwin/imodels-client-management";

class TestEntity {
  constructor(public index: number) {
  }
}

describe("AsyncIterableIterator utility functions", () => {
  it("should should convert into array", async () => {
    // Arrange
    const testIterator = getTestIterator(5);

    // Act
    const entities: TestEntity[] = await toArray(testIterator);

    // Assert
    expect(entities.length).to.equal(5);
    for (let i = 0; i < entities.length; i++)
      expect(entities[i].index).to.equal(i);
  });

  it("should take top n elements", async () => {
    // Arrange
    const testIterator = getTestIterator(5);

    // Act
    const entities: TestEntity[] = await take(testIterator, 1);

    // Assert
    expect(entities.length).to.equal(1);
    expect(entities[0].index).to.equal(0);
  });

  async function* getTestIterator(count: number): AsyncIterableIterator<TestEntity> {
    for (let i = 0; i < count; i++)
      yield new TestEntity(i);
  }
});
