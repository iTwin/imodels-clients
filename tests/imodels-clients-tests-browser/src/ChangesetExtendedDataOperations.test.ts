/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetExtendedDataOperations } from "@itwin/imodels-client-management/lib/esm/operations";
import { assertChangesetExtendedDataBrowser, assertCollection } from "@itwin/imodels-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

import { ApiOptions, Authorization, AuthorizationCallback, ChangesetExtendedData, GetChangesetExtendedDataListParams, GetSingleChangesetExtendedDataParams, IModelsClient } from "@itwin/imodels-client-management";

import { FrontendTestEnvVariableKeys } from "./setup/FrontendTestEnvVariableKeys";

describe(`[Management] ${ChangesetExtendedDataOperations.name}`, () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForReadId: string;

  before(async () => {
    const iModelsClientApiOptions: ApiOptions = JSON.parse(Cypress.env(FrontendTestEnvVariableKeys.iModelsClientApiOptions));
    iModelsClient = new IModelsClient({ api: iModelsClientApiOptions });

    const admin1AuthorizationInfo: Authorization = JSON.parse(Cypress.env(FrontendTestEnvVariableKeys.admin1AuthorizationInfo));
    authorization = async () => admin1AuthorizationInfo;

    testIModelForReadId = Cypress.env(FrontendTestEnvVariableKeys.testIModelForReadId);
  });

  it("should get changeset extended data by changeset index", async () => {
    // Arrange
    const expectedChangesetExtendedData = {
      changesetIndex: 1,
      data: { someKey: "someValue" }
    };

    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams = {
      authorization,
      iModelId: testIModelForReadId,
      changesetIndex: 1
    };

    // Act
    const changesetExtendedData: ChangesetExtendedData = await iModelsClient.changesetExtendedData.getSingle(getSingleChangesetExtendedDataParams);

    // Assert
    assertChangesetExtendedDataBrowser({ actualChangesetExtendedData: changesetExtendedData, expectedChangesetExtendedData });
  });

  it("should be able to get changeset extended data list", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams = {
      authorization,
      iModelId: testIModelForReadId
    };
    // Act
    const changesetExtendedData = iModelsClient.changesetExtendedData.getList(getChangesetExtendedDataListParams);
    expect(changesetExtendedData).to.not.be.undefined;

    // Assert
    await assertCollection({
      asyncIterable: changesetExtendedData,
      isEntityCountCorrect: (count) => (count > 0)
    });
  });
});
