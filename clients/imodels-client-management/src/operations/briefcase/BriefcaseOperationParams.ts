/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, RequestContextParam } from "../../base";

export interface GetBriefcaseListParams extends RequestContextParam {
  imodelId: string;
  urlParams?: CollectionRequestParams; // todo: extract
}

export interface GetBriefcaseByIdParams extends RequestContextParam {
  imodelId: string;
  briefcaseId: number;
}
