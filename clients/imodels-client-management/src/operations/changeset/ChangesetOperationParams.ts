/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, RequestContextParam } from "../../base";

export interface GetChangesetListParams extends RequestContextParam {
  imodelId: string;
  urlParams?: CollectionRequestParams;
}

export interface GetChangesetByIdParams extends RequestContextParam {
  imodelId: string;
  changesetId: string;
}
