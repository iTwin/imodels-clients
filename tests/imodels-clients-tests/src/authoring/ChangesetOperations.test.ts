/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AcquireBriefcaseParams, CreateChangesetParams, RequestContext, iModel, iModelsClient, DownloadChangesetsParams } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, TestiModelMetadata, cleanUpiModels, createEmptyiModel } from "../common";
import { assertChangeset } from "../common/AssertionUtils";

describe("[Authoring] ChangesetOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModel;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringChangesetOperations"
      }
    });

    testiModel = await createEmptyiModel({
      imodelsClient,
      requestContext,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
  });

  it("should create changeset", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      requestContext,
      imodelId: testiModel.id
    };
    const briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    const changesetMetadata = TestiModelMetadata.Changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      requestContext,
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

  it.only("should download changesets", async () => {
    // Arrange
    const downloadChangesetsParams: DownloadChangesetsParams = {
      requestContext,
      imodelId: testiModel.id,
      targetPath: Constants.DownloadPath
    };

    // Act
    const changesets = await imodelsClient.Changesets.download(downloadChangesetsParams);

    // Assert
    expect(changesets.length).to.equal(TestiModelMetadata.Changesets.length);
  });
});
