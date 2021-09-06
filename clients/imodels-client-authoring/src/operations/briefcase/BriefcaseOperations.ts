/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "@itwin/imodels-client-management";
import { Briefcase, BriefcaseAcquireResponse } from "../../base";
import { CreateBriefcaseParams } from "./BriefcaseOperationParams";

export class BriefcaseOperations extends OperationsBase {
  public async acquire(params: CreateBriefcaseParams): Promise<Briefcase> {
    const briefcaseAcquireResponse = await this.sendPostRequest<BriefcaseAcquireResponse>({
      requestContext: params.requestContext,
      url: `${this._apiBaseUrl}/${params.imodelId}/briefcases`,
      body: params.briefcaseProperties
    });
    return briefcaseAcquireResponse.briefcase;
  }
}