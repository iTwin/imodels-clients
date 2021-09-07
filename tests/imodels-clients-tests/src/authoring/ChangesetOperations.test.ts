/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateChangesetParams, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { cleanUpiModels, createEmptyiModel } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestiModelDataReader } from "../TestiModelDataReader";
import { TestSuiteContext } from "../TestSuiteContext";

describe("[Authoring] ChangesetOperations", () => {
  let testContext: TestSuiteContext;
  let imodelsClient: iModelsClient;
  let testiModel: iModel;
  let testiModelDataReader: TestiModelDataReader;

  before(async () => {
    testContext = new TestSuiteContext({
      package: Constants.PackagePrefix,
      testSuite: "[Authoring][ChangesetOperations]"
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);

    testiModel = await createEmptyiModel({ imodelsClient, testContext, imodelName: "" });
    testiModelDataReader = new TestiModelDataReader();
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should create changeset", async () => {
    // Arrange
    const changesetMetadata = testiModelDataReader.Changesets[0];

    const changesetCreationParams: CreateChangesetParams = {
      requestContext: testContext.RequestContext,
      imodelId: testiModel.id,
      changesetProperties: {
        briefcaseId: 1,
        id: changesetMetadata.id,
        changesetFilePath: changesetMetadata.parentId
      }
    };

    // Act
    const changeset = await imodelsClient.Changesets.create(changesetCreationParams);

    // Assert
    expect(changeset).to.not.be.undefined;
  });
});
