/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityPageQueryFunc } from "@itwin/imodels-client-management";

export class TestEntity {
  constructor(
    public pageIndex: number | undefined,
    public entityIndex: number
  ) { }
}

export function getEntityPageQueryFunc(pageCount: number, entityCountPerPage: number): EntityPageQueryFunc<TestEntity> {
  return getEntityPageQueryFuncInternal(0, pageCount, entityCountPerPage);
}

function getEntityPageQueryFuncInternal(currentPageIndex: number, pageCount: number, entityCountPerPage: number): EntityPageQueryFunc<TestEntity> {
  const currentPageEntities: TestEntity[] = [];
  for (let i = 0; i < entityCountPerPage; i++)
    currentPageEntities.push(new TestEntity(currentPageIndex, currentPageIndex * entityCountPerPage + i));

  const isCurrentPageLast = currentPageIndex === pageCount - 1;
  const nextPage = isCurrentPageLast
    ? undefined
    : getEntityPageQueryFuncInternal(currentPageIndex + 1, pageCount, entityCountPerPage);

  return async () => ({
    entities: currentPageEntities,
    next: nextPage
  });
}
