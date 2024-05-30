/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as sinon from "sinon";

import { IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-management";

describe("[Management] UseExperimental features", () => {
  it("changeset extended data operation should execute when useExperimental=true", async () => {
    // Arrange
    const iModelsClientOptions: IModelsClientOptions = {
      useExperimental: true
    };
    const iModelsClient = new IModelsClient(iModelsClientOptions);

    // Act
    const changesetExtendedDataGetListStub = sinon.replace(iModelsClient.changesetExtendedData, "getList", sinon.fake());
    changesetExtendedDataGetListStub();

    // Assert
    expect(changesetExtendedDataGetListStub()).to.not.throw;
  });

  it("changeset extended data operation should fail when useExperimental=false", async () => {
    // Arrange
    const iModelsClientOptions: IModelsClientOptions = {
      useExperimental: false
    };
    const iModelsClient = new IModelsClient(iModelsClientOptions);

    // Act
    let objectThrown: unknown;
    try {
      const changesetExtendedDataGetListStub = sinon.replace(iModelsClient.changesetExtendedData, "getList", sinon.fake());
      changesetExtendedDataGetListStub();
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    expect(objectThrown).to.be.not.undefined;
    expect(objectThrown instanceof Error);
    const error = objectThrown as Error;
    expect(error.message).to.be.equal("This operation is experimental and requires the useExperimental flag to be set to true in the client options.");
  });
});
