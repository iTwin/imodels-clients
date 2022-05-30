/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";
import { BehaviorOptions, IModelsClientsTestsConfig } from "../../IModelsClientsTestsConfig";

@injectable()
export class ReusableTestIModelProviderConfig {
  public testIModelName: string;
  public behaviorOptions: Pick<BehaviorOptions, "recreateReusableIModel">;

  constructor(
    config: IModelsClientsTestsConfig
  ) {
    this.testIModelName = config.testIModelName;
    this.behaviorOptions = config.behaviorOptions;
  }
}
