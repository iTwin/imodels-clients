/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcasesResponse, MinimalBriefcase, OperationsBase, PreferReturn, EntityListIteratorImpl } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetBriefcaseListParams, GetSingleBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  public getMinimalList(params: GetBriefcaseListParams): AsyncIterableIterator<MinimalBriefcase> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalBriefcase>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as BriefcasesResponse<MinimalBriefcase>).briefcases
    }));
  }

  public getRepresentationList(params: GetBriefcaseListParams): AsyncIterableIterator<Briefcase> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<Briefcase>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as BriefcasesResponse<Briefcase>).briefcases
    }));
  }

  public async getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase> {
    const response = await this.sendGetRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({ iModelId: params.iModelId, briefcaseId: params.briefcaseId })
    });
    return response.briefcase;
  }
}
