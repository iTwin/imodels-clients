/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { DeleteIModelParams } from "@itwin/imodels-client-authoring";
import { inject, injectable } from "inversify";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { ReusableTestIModelProviderConfig } from "./ReusableTestIModelProviderConfig";
import { TestIModelCreator } from "./TestIModelCreator";
import { ReusableIModelMetadata } from "./TestIModelInterfaces";
import { TestIModelRetriever } from "./TestIModelRetriever";
import { TestIModelsClient } from "./TestIModelsClient";

@injectable()
export class ReusableTestIModelProvider {
  private _reusableIModel: ReusableIModelMetadata | undefined;

  constructor(
    @inject(ReusableTestIModelProviderConfig)
    private readonly _config: ReusableTestIModelProviderConfig,
    @inject(TestIModelsClient)
    private readonly _iModelsClient: TestIModelsClient,
    @inject(TestAuthorizationProvider)
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    @inject(TestIModelRetriever)
    private readonly _testIModelRetriever: TestIModelRetriever,
    @inject(TestIModelCreator)
    private readonly _testIModelCreator: TestIModelCreator
  ) { }

  public async getOrCreate(): Promise<ReusableIModelMetadata> {
    if (!this._reusableIModel)
      this._reusableIModel = await this.get()

    return this._reusableIModel;
  }

  private async get(): Promise<ReusableIModelMetadata> {
    const existingReusableIModel = await this._testIModelRetriever.findIModelByName(this._config.testIModelName);
    if (!existingReusableIModel)
      return this._testIModelCreator.createReusable(this._config.testIModelName);

    if (this._config.behaviorOptions.recreateReusableIModel) {
      await this.deleteIModel(existingReusableIModel.id);
      return this._testIModelCreator.createReusable(this._config.testIModelName);
    }

    return this._testIModelRetriever.queryRelatedData(existingReusableIModel);
  }

  private async deleteIModel(iModelId: string): Promise<void> {
    const deleteIModelParams: DeleteIModelParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    return this._iModelsClient.iModels.delete(deleteIModelParams);
  }

}
