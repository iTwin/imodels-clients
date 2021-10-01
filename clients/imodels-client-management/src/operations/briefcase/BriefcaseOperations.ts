/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcasesResponse, MinimalBriefcase, OperationsBase, PreferReturn, getCollectionIterator } from "../../base";
import { GetBriefcaseByIdParams, GetBriefcaseListParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations extends OperationsBase {
  public getMinimalList(params: GetBriefcaseListParams): AsyncIterableIterator<MinimalBriefcase> {
    return getCollectionIterator(() => this.getEntityCollectionPage<MinimalBriefcase>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: BriefcasesResponse<MinimalBriefcase>) => response.briefcases
    }));
  }

  public getRepresentationList(params: GetBriefcaseListParams): AsyncIterableIterator<Briefcase> {
    return getCollectionIterator(() => this.getEntityCollectionPage<Briefcase>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: BriefcasesResponse<Briefcase>) => response.briefcases
    }));
  }

  public async getById(params: GetBriefcaseByIdParams): Promise<Briefcase> {
    const response = await this.sendGetRequest<BriefcaseResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases/${params.briefcaseId}`
    });
    return response.briefcase;
  }
}
