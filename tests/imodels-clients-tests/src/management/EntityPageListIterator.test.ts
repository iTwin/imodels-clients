/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityPageListIterator, EntityPageQueryFunc } from "@itwin/imodels-client-management";
import { expect } from "chai";

describe("EntityPageListIterator", () => {
  it("should return entities in pages", async () => {
    // Arrange
    const testIterator = new EntityPageListIterator(getTestEntityPageQueryFunc(2, 2));
    let currentPageCount = 0;

    // Act & Assert
    for await (const page of testIterator) {
      expect(page.length).to.be.equal(2);
      for (let entityIndex = 0; entityIndex < page.length; entityIndex++) {
        expect(page[entityIndex].pageIndex).to.be.equal(currentPageCount);
        expect(page[entityIndex].entityIndex).to.be.equal(entityIndex);
      }
      currentPageCount++;
    }
    expect(currentPageCount).to.be.equal(2);
  });
});

export class TestEntity {
  constructor(public pageIndex: number | undefined, public entityIndex: number) {
  }
}

export function getTestEntityPageQueryFunc(pageCount: number, entityCountPerPage: number): EntityPageQueryFunc<TestEntity> {
  return getTestEntityPageQueryFuncInternal(0, pageCount, entityCountPerPage);
}

export function getTestEntityPageQueryFuncInternal(currentPageIndex: number, pageCount: number, entityCountPerPage: number): EntityPageQueryFunc<TestEntity> {
  const entities: TestEntity[] = [];
  for (let i = 0; i < entityCountPerPage; i++)
    entities.push(new TestEntity(currentPageIndex, currentPageIndex * entityCountPerPage + i));

  return async () => ({
    entities,
    next: currentPageIndex === pageCount - 1
      ? undefined
      : getTestEntityPageQueryFuncInternal(currentPageIndex + 1, pageCount, entityCountPerPage)
  });
}