/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { inject, injectable } from "inversify";
import { ReusableTestIModelProviderConfig } from "./ReusableTestIModelProviderConfig";
import { TestIModelCreator } from "./TestIModelCreator";
import { ReusableIModelMetadata } from "./TestIModelInterfaces";
import { TestIModelRetriever } from "./TestIModelRetriever";

@injectable()
export class ReusableTestIModelProvider {
  private _reusableIModel: ReusableIModelMetadata | undefined;

  constructor(
    @inject(ReusableTestIModelProviderConfig)
    private readonly _config: ReusableTestIModelProviderConfig,
    @inject(TestIModelRetriever)
    private readonly _testIModelRetriever: TestIModelRetriever,
    @inject(TestIModelCreator)
    private readonly _testIModelCreator: TestIModelCreator
  ) { }

  public async getOrCreate(): Promise<ReusableIModelMetadata> {
    if (this._reusableIModel)
      return this._reusableIModel;

    this._reusableIModel =
      await this._testIModelRetriever.queryWithRelatedData(this._config.testIModelName) ??
      await this._testIModelCreator.createReusable(this._config.testIModelName);

    return this._reusableIModel;
  }
}
