/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIterator, EntityListIteratorImpl } from "@itwin/imodels-client-management";
import { expect } from "chai";
import { getTestEntityPageQueryFunc, TestEntity } from "./EntityPageListIterator.test";

describe("EntityListIteratorImpl", () => {
  it("should return entities", async () => {
    // Arrange
    const testIterator: EntityListIterator<TestEntity> = new EntityListIteratorImpl(getTestEntityPageQueryFunc(2, 2));
    const entities: TestEntity[] = [];

    // Act
    for await (const entity of testIterator)
      entities.push(entity);

    // Assert
    expect(entities.length).to.be.equal(4);
  });

  it.only("should allow to get raw pages", async () => {
    // Arrange
    const testIterator: EntityListIterator<TestEntity> = new EntityListIteratorImpl(getTestEntityPageQueryFunc(2, 2));
    const entityPages: TestEntity[][] = [];

    // Act
    for await (const entityPage of testIterator.byPage())
      entityPages.push(entityPage);

    // Assert
    expect(entityPages.length).to.be.equal(2);
    expect(entityPages[0].length).to.be.equal(2);
    expect(entityPages[1].length).to.be.equal(2);

    let currentPageIndex = 0;
    let currentEntityIndex = 0;

    expect(entityPages.length).to.be.equal(2);
    for (const entityPage of entityPages) {
      expect(entityPage.length).to.equal(2);
      for (const entity of entityPage) {
        expect(entity.pageIndex).to.be.equal(currentPageIndex);
        expect(entity.entityIndex).to.be.equal(currentEntityIndex);

        currentEntityIndex++;
      }
      currentPageIndex++;
    }
  });
});