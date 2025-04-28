/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcaseOperations as ManagementBriefcaseOperations } from "@itwin/imodels-client-management";

import { OperationOptions } from "../OperationOptions";

import { AcquireBriefcaseParams, BriefcaseProperties, ReleaseBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations<TOptions extends OperationOptions> extends ManagementBriefcaseOperations<TOptions> {
  /**
   * Acquires a new Briefcase with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/acquire-imodel-briefcase/ Acquire iModel Briefcase}
   * operation from iModels API.
   * @param {AcquireBriefcaseParams} params parameters for this operation. See {@link AcquireBriefcaseParams}.
   * @returns {Promise<Briefcase>} newly acquired Briefcase. See {@link Briefcase}.
   */
  public async acquire(params: AcquireBriefcaseParams): Promise<Briefcase> {
    const acquireBriefcaseBody = this.getAcquireBriefcaseRequestBody(params.briefcaseProperties);
    const acquireBriefcaseResponse = await this.sendPostRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ iModelId: params.iModelId }),
      body: acquireBriefcaseBody,
      headers: params.headers
    });
    const result = this.appendRelatedEntityCallbacks(params.authorization, acquireBriefcaseResponse.body.briefcase, params.headers);
    return result;
  }

  /**
   * Releases the specified Briefcase. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/release-imodel-briefcase/ Release iModel Briefcase}
   * operation from iModels API.
   * @param {ReleaseBriefcaseParams} params parameters for this operation. See {@link ReleaseBriefcaseParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async release(params: ReleaseBriefcaseParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({ iModelId: params.iModelId, briefcaseId: params.briefcaseId }),
      headers: params.headers
    });
  }

  private getAcquireBriefcaseRequestBody(briefcaseProperties: BriefcaseProperties | undefined): object | undefined {
    if (!briefcaseProperties)
      return undefined;

    return {
      deviceName: briefcaseProperties.deviceName
    };
  }
}
