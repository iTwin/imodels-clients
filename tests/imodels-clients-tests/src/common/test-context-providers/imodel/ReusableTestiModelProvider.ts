/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config } from "../../Config";
import { TestiModelCreator } from "./TestiModelCreator";
import { TestiModelSetupContext, ReusableiModelMetadata } from "./TestiModelInterfaces";
import { TestiModelRetriever } from "./TestiModelRetriever";

export class ReusableTestiModelProvider {
  private static _reusableiModel: ReusableiModelMetadata | undefined;

  public static async getOrCreate(params: TestiModelSetupContext & { projectId: string }): Promise<ReusableiModelMetadata> {
    if (ReusableTestiModelProvider._reusableiModel)
      return ReusableTestiModelProvider._reusableiModel;

    const paramsWithiModelName = {
      ...params,
      imodelName: Config.get().testiModelName
    };

    ReusableTestiModelProvider._reusableiModel =
      await TestiModelRetriever.queryWithRelatedData(paramsWithiModelName) ??
      await TestiModelCreator.createReusable(paramsWithiModelName);

    return ReusableTestiModelProvider._reusableiModel!;
  }
}
