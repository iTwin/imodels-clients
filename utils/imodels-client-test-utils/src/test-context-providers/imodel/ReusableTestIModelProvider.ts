/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { DeleteIModelParams } from "@itwin/imodels-client-authoring";

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
    private readonly _config: ReusableTestIModelProviderConfig,
    private readonly _iModelsClient: TestIModelsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testIModelRetriever: TestIModelRetriever,
    private readonly _testIModelCreator: TestIModelCreator
  ) { }

  public async getOrCreate(): Promise<ReusableIModelMetadata> {
    if (!this._reusableIModel)
      this._reusableIModel = await this.get();

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
