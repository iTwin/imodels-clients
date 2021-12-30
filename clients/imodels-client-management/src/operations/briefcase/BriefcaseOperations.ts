/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcasesResponse, EntityListIterator, EntityListIteratorImpl, MinimalBriefcase, OperationsBase, PreferReturn } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { GetBriefcaseListParams, GetSingleBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets Briefcases of a specific iModel. This method returns Briefcases in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-briefcases/ Get iModel Briefcases}
   * operation from iModels API.
   * @param {GetBriefcaseListParams} params parameters for this operation. See {@link GetBriefcaseListParams}.
   * @returns {EntityListIterator<MinimalBriefcase>} iterator for Briefcase list. See {@link EntityListIterator},
   * {@link MinimalBriefcase}.
   */
  public getMinimalList(params: GetBriefcaseListParams): EntityListIterator<MinimalBriefcase> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalBriefcase>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as BriefcasesResponse<MinimalBriefcase>).briefcases
    }));
  }

  /**
   * Gets Briefcases of a specific iModel. This method returns Briefcases in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-briefcases/ Get iModel Briefcases}
   * operation from iModels API.
   * @param {GetBriefcaseListParams} params parameters for this operation. See {@link GetBriefcaseListParams}.
   * @returns {EntityListIterator<Briefcase>} iterator for Briefcase list. See {@link EntityListIterator}, {@link Briefcase}.
   */
  public getRepresentationList(params: GetBriefcaseListParams): EntityListIterator<Briefcase> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<Briefcase>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as BriefcasesResponse<Briefcase>).briefcases
    }));
  }

  /**
   * Gets a single Briefcase by its id. This method returns a Briefcase in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-briefcase-details/ Get iModel Briefcase}
   * operation from iModels API.
   * @param {GetSingleBriefcaseParams} params parameters for this operation. See {@link GetSingleBriefcaseParams}.
   * @returns {Promise<Briefcase>} an Briefcase with specified id. See {@link iModel}.
   */
  public async getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase> {
    const response = await this.sendGetRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({ iModelId: params.iModelId, briefcaseId: params.briefcaseId })
    });
    return response.briefcase;
  }
}
