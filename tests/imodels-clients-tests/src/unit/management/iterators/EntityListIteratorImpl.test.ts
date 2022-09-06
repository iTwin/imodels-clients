/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIteratorImpl } from "@itwin/imodels-client-management/lib/cjs/base/internal";
import { expect } from "chai";

import { EntityListIterator } from "@itwin/imodels-client-management";

import { TestEntity, getEntityPageQueryFunc } from "./TestEntityPageFunctions";

describe("EntityListIteratorImpl", () => {
  it("should return entities", async () => {
    // Arrange
    const testIterator: EntityListIterator<TestEntity> = new EntityListIteratorImpl(getEntityPageQueryFunc(2, 2));
    const entities: TestEntity[] = [];

    // Act
    for await (const entity of testIterator)
      entities.push(entity);

    // Assert
    expect(entities.length).to.be.equal(4);
    for (let i = 0; i < entities.length; i++)
      expect(entities[i].entityIndex).to.be.equal(i);
  });

  it("should allow to get raw entity pages", async () => {
    // Arrange
    const testIterator: EntityListIterator<TestEntity> = new EntityListIteratorImpl(getEntityPageQueryFunc(2, 2));
    const entityPages: TestEntity[][] = [];

    // Act
    for await (const entityPage of testIterator.byPage())
      entityPages.push(entityPage);

    // Assert
    expect(entityPages.length).to.be.equal(2);
    for (let i = 0; i < entityPages.length; i++)
      for (const entity of entityPages[i])
        expect(entity.pageIndex).to.be.equal(i);

    const entities = entityPages.flatMap((value) => value);
    expect(entities.length).to.be.equal(4);
    for (let i = 0; i < entities.length; i++)
      expect(entities[i].entityIndex).to.be.equal(i);
  });
});
