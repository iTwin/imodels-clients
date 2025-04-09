/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BriefcaseResponse, BriefcasesResponse, CheckpointResponse, EntityListIteratorImpl, OperationsBase } from "../../base/internal/index.js";
import { AuthorizationCallback, Briefcase, EntityListIterator, HeaderFactories, HttpResponse, MinimalBriefcase, PreferReturn } from "../../base/types/index.js";
import { IModelsClient } from "../../IModelsClient.js";
import { OperationOptions } from "../OperationOptions.js";
import { assertLink, getUser } from "../SharedFunctions.js";

import { GetBriefcaseListParams, GetSingleBriefcaseParams } from "./BriefcaseOperationParams.js";

export class BriefcaseOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
    private _iModelsClient: IModelsClient
  ) {
    super(options);
  }

  /**
   * Gets Briefcases of a specific iModel. This method returns Briefcases in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-briefcases/ Get iModel Briefcases}
   * operation from iModels API.
   * @param {GetBriefcaseListParams} params parameters for this operation. See {@link GetBriefcaseListParams}.
   * @returns {EntityListIterator<MinimalBriefcase>} iterator for Briefcase list. See {@link EntityListIterator},
   * {@link MinimalBriefcase}.
   */
  public getMinimalList(params: GetBriefcaseListParams): EntityListIterator<MinimalBriefcase> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalBriefcase, BriefcasesResponse<MinimalBriefcase>>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response) => response.body.briefcases,
      headers: params.headers
    }));
  }

  /**
   * Gets Briefcases of a specific iModel. This method returns Briefcases in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-briefcases/ Get iModel Briefcases}
   * operation from iModels API.
   * @param {GetBriefcaseListParams} params parameters for this operation. See {@link GetBriefcaseListParams}.
   * @returns {EntityListIterator<Briefcase>} iterator for Briefcase list. See {@link EntityListIterator}, {@link Briefcase}.
   */
  public getRepresentationList(params: GetBriefcaseListParams): EntityListIterator<Briefcase> {
    const entityCollectionAccessor = (response: HttpResponse<BriefcasesResponse<Briefcase>>) => {
      const briefcases = response.body.briefcases;
      const mappedBriefcases = briefcases.map((briefcase) => this.appendRelatedEntityCallbacks(params.authorization, briefcase, params.headers));
      return mappedBriefcases;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<Briefcase, BriefcasesResponse<Briefcase>>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId, urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor,
      headers: params.headers
    }));
  }

  /**
   * Gets a single Briefcase by its id. This method returns a Briefcase in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-briefcase-details/ Get iModel Briefcase}
   * operation from iModels API.
   * @param {GetSingleBriefcaseParams} params parameters for this operation. See {@link GetSingleBriefcaseParams}.
   * @returns {Promise<Briefcase>} an Briefcase with specified id. See {@link iModel}.
   */
  public async getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase> {
    const response = await this.sendGetRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({ iModelId: params.iModelId, briefcaseId: params.briefcaseId }),
      headers: params.headers
    });
    const result: Briefcase = this.appendRelatedEntityCallbacks(params.authorization, response.body.briefcase, params.headers);
    return result;
  }

  protected appendRelatedEntityCallbacks(authorization: AuthorizationCallback, briefcase: Briefcase, headers?: HeaderFactories): Briefcase {
    const getOwner = async () => getUser(
      authorization,
      this._iModelsClient.users,
      this._options.urlFormatter,
      briefcase._links.owner?.href,
      headers
    );

    const checkpointLink = briefcase._links.checkpoint;
    assertLink(checkpointLink);
    const getCheckpoint = async () => {
      const response = await this.sendGetRequest<CheckpointResponse>({
        authorization,
        url: checkpointLink.href,
        headers
      });
      return response.body.checkpoint;
    };

    const result: Briefcase = {
      ...briefcase,
      getOwner,
      getCheckpoint
    };

    return result;
  }
}
