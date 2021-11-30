/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Briefcase, BriefcaseResponse, BriefcaseOperations as ManagementBriefcaseOperations } from "@itwin/imodels-client-management";
import { OperationOptions } from "../OperationOptions";
import { AcquireBriefcaseParams, BriefcaseProperties, ReleaseBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations<TOptions extends OperationOptions> extends ManagementBriefcaseOperations<TOptions> {
  public async acquire(params: AcquireBriefcaseParams): Promise<Briefcase> {
    const acquireBriefcaseBody = this.getAcquireBriefcaseRequestBody(params.briefcaseProperties);
    const acquireBriefcaseResponse = await this.sendPostRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getBriefcaseListUrl({ imodelId: params.imodelId }),
      body: acquireBriefcaseBody
    });
    return acquireBriefcaseResponse.briefcase;
  }

  public async release(params: ReleaseBriefcaseParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({ imodelId: params.imodelId, briefcaseId: params.briefcaseId })
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
