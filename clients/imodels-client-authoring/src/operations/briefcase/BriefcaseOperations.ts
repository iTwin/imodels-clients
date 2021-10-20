/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcaseOperations as ManagementBriefcaseOperations } from "@itwin/imodels-client-management";
import { AcquireBriefcaseParams, ReleaseBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations extends ManagementBriefcaseOperations {
  public async acquire(params: AcquireBriefcaseParams): Promise<Briefcase> {
    const briefcaseAcquireResponse = await this.sendPostRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases`,
      body: params.briefcaseProperties
    });
    return briefcaseAcquireResponse.briefcase;
  }

  public release(params: ReleaseBriefcaseParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases/${params.briefcaseId}`
    });
  }
}
