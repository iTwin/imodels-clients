/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcasesResponse, getPagedCollectionGenerator, MinimalBriefcase, OperationsBase, PreferReturn } from "../../base";
import { GetBriefcaseByIdParams, GetBriefcaseListParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations extends OperationsBase {
  public getMinimalList(params: GetBriefcaseListParams): AsyncIterableIterator<MinimalBriefcase> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<MinimalBriefcase>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases${this.formUrlParams({ ...params.urlParams })}`,
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: BriefcasesResponse<MinimalBriefcase>) => response.briefcases
    }));
  }

  public getRepresentationList(params: GetBriefcaseListParams): AsyncIterableIterator<Briefcase> {
    return getPagedCollectionGenerator(() => this.getEntityCollectionPage<Briefcase>({
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
