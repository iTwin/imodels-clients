/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { TestiModelSetupContext, TestiModelWithChangesetsAndNamedVersions } from "./TestiModelInterfaces"
import { TestiModelCreator } from "./TestiModelCreator";
import { TestiModelRetriever } from "./TestiModelRetriever";
import { Config } from "../../Config";

export class ReusableTestiModelProvider {
  private static _reusableiModel: TestiModelWithChangesetsAndNamedVersions | undefined;

  public static async getOrCreate(params: TestiModelSetupContext & { projectId: string }): Promise<TestiModelWithChangesetsAndNamedVersions> {
    if (ReusableTestiModelProvider._reusableiModel)
      return ReusableTestiModelProvider._reusableiModel;

    const paramsWithiModelName = {
      ...params,
      imodelName: Config.get().testiModelName
    };

    ReusableTestiModelProvider._reusableiModel =
      await TestiModelRetriever.queryWithRelatedData(paramsWithiModelName) ??
      await TestiModelCreator.createWithChangesetsAndNamedVersions(paramsWithiModelName);

    return ReusableTestiModelProvider._reusableiModel!;
  }
}