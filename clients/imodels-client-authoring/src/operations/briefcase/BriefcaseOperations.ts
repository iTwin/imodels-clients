/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcaseOperations as ManagementBriefcaseOperations } from "@itwin/imodels-client-management";
import { OperationOptions } from "../OperationOptions";
import { AcquireBriefcaseParams, ReleaseBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations<TOptions extends OperationOptions> extends ManagementBriefcaseOperations<TOptions> {
  public async acquire(params: AcquireBriefcaseParams): Promise<Briefcase> {
    const briefcaseAcquireResponse = await this.sendPostRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}/${params.imodelId}/briefcases`,
      body: params.briefcaseProperties
    });
    return briefcaseAcquireResponse.briefcase;
  }

  public async release(params: ReleaseBriefcaseParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: `${this._options.urlFormatter.baseUri}/${params.imodelId}/briefcases/${params.briefcaseId}`
    });
  }
}
