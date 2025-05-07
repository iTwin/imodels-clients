/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ApiOptions,
  Authorization,
  AuthorizationCallback,
  ChangesetExtendedData,
  ChangesetExtendedDataOperations,
  GetChangesetExtendedDataListParams,
  GetSingleChangesetExtendedDataParams,
  IModelsClient,
} from "@itwin/imodels-client-management";
import {
  assertChangesetExtendedDataBrowser,
  assertCollection,
} from "@itwin/imodels-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

import { FrontendTestEnvVariableKeys } from "./setup/FrontendTestEnvVariableKeys";

describe(`[Management] ${ChangesetExtendedDataOperations.name}`, () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForReadId: string;

  before(() => {
    const iModelsClientApiOptions: ApiOptions = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Cypress.env(FrontendTestEnvVariableKeys.iModelsClientApiOptions)
    );
    iModelsClient = new IModelsClient({ api: iModelsClientApiOptions });

    const admin1AuthorizationInfo: Authorization = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Cypress.env(FrontendTestEnvVariableKeys.admin1AuthorizationInfo)
    );
    authorization = () => Promise.resolve(admin1AuthorizationInfo);

    testIModelForReadId = Cypress.env(
      FrontendTestEnvVariableKeys.testIModelForReadId
    );
  });

  it("should get changeset extended data by changeset index", async () => {
    // Arrange
    const expectedChangesetExtendedData = {
      changesetIndex: 1,
      data: { someKey: "someValue" },
    };

    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iModelId: testIModelForReadId,
        changesetIndex: 1,
      };

    // Act
    const changesetExtendedData: ChangesetExtendedData =
      await iModelsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );

    // Assert
    assertChangesetExtendedDataBrowser({
      actualChangesetExtendedData: changesetExtendedData,
      expectedChangesetExtendedData,
    });
  });

  it("should be able to get changeset extended data list", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization,
        iModelId: testIModelForReadId,
      };
    // Act
    const changesetExtendedData = iModelsClient.changesetExtendedData.getList(
      getChangesetExtendedDataListParams
    );
    expect(changesetExtendedData).to.not.be.undefined;

    // Assert
    await assertCollection({
      asyncIterable: changesetExtendedData,
      isEntityCountCorrect: (count) => count > 0,
    });
  });
});
