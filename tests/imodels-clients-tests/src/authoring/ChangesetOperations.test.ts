/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, CreateChangesetParams, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { assertChangeset } from "../AssertionUtils";
import { cleanUpiModels, createEmptyiModel } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestContext } from "../TestContext";
import { TestiModelMetadata } from "../TestiModelMetadata";

describe("[Authoring] ChangesetOperations", () => {
  let testContext: TestContext;
  let imodelsClient: iModelsClient;
  let testiModel: iModel;

  before(async () => {
    testContext = new TestContext({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringChangesetOperations"
      }
    });

    imodelsClient = new iModelsClient(testContext.ClientConfig);
    testiModel = await createEmptyiModel({
      imodelsClient,
      testContext,
      imodelName: testContext.getPrefixediModelName("Test iModel for write")
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, testContext });
  });

  it("should create changeset", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      requestContext: testContext.RequestContext,
      imodelId: testiModel.id
    };
    const briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    const changesetMetadata = TestiModelMetadata.Changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      requestContext: testContext.RequestContext,
      imodelId: testiModel.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: changesetMetadata.id,
        changesetFilePath: changesetMetadata.changesetFilePath
      }
    };

    // Act
    const changeset = await imodelsClient.Changesets.create(createChangesetParams);

    // Assert
    assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: createChangesetParams.changesetProperties
    });
  });
});

