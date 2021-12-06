/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Config } from "../../Config";
import { TestIModelCreator } from "./TestIModelCreator";
import { ReusableIModelMetadata, TestIModelSetupContext } from "./TestIModelInterfaces";
import { TestIModelRetriever } from "./TestIModelRetriever";

export class ReusableTestIModelProvider {
  private static _reusableIModel: ReusableIModelMetadata | undefined;

  public static async getOrCreate(params: TestIModelSetupContext & { projectId: string }): Promise<ReusableIModelMetadata> {
    if (ReusableTestIModelProvider._reusableIModel)
      return ReusableTestIModelProvider._reusableIModel;

    const paramsWithIModelName = {
      ...params,
      iModelName: Config.get().testIModelName
    };

    ReusableTestIModelProvider._reusableIModel =
      await TestIModelRetriever.queryWithRelatedData(paramsWithIModelName) ??
      await TestIModelCreator.createReusable(paramsWithIModelName);

    return ReusableTestIModelProvider._reusableIModel;
  }
}
