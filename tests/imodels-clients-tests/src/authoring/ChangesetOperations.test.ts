/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { AcquireBriefcaseParams, CreateChangesetParams, RequestContext, iModel, iModelsClient, DownloadChangesetsParams } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, TestiModelMetadata, cleanUpiModels, createEmptyiModel, Config, findiModelWithName, cleanupDirectory } from "../common";
import { assertChangeset } from "../common/AssertionUtils";

describe("[Authoring] ChangesetOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  let testiModelForWrite: iModel;
  let testiModelForDownload: iModel;

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

    testiModelForWrite = await createEmptyiModel({
      imodelsClient,
      requestContext,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });

    testiModelForDownload = await findiModelWithName({
      imodelsClient,
      requestContext,
      projectId,
      expectediModelname: Config.get().testiModelName
    });
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
  });

  it("should create changeset", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      requestContext,
      imodelId: testiModelForWrite.id
    };
    const briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    const changesetMetadata = TestiModelMetadata.Changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      requestContext,
      imodelId: testiModelForWrite.id,
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

  it("should download all changesets", async () => {
    // Arrange
    const downloadPath = Constants.TestDownloadDirectoryPath;
    const downloadChangesetsParams: DownloadChangesetsParams = {
      requestContext,
      imodelId: testiModelForDownload.id,
      targetDirectoryPath: downloadPath
    };

    // Act
    const changesets = await imodelsClient.Changesets.download(downloadChangesetsParams);

    // Assert
    expect(changesets.length).to.equal(TestiModelMetadata.Changesets.length);
    expect(fs.readdirSync(downloadPath).length).to.equal(TestiModelMetadata.Changesets.length);

    for (const changeset of changesets) {
      const changesetMetadata = TestiModelMetadata.Changesets.find(changesetMetadata => changesetMetadata.index === changeset.index)
      assertChangeset({
        actualChangeset: changeset,
        expectedChangesetProperties: {
          id: changesetMetadata.id,
          briefcaseId: TestiModelMetadata.Briefcase.id,
          parentId: changesetMetadata.parentId,
          description: changesetMetadata.description,
          containingChanges: changesetMetadata.containingChanges,
          changesetFilePath: changesetMetadata.changesetFilePath
        }
      });

      expect(fs.existsSync(changeset.filePath)).to.equal(true);
      expect(fs.statSync(changeset.filePath).size).to.equal(fs.statSync(changesetMetadata.changesetFilePath).size);
    }
  });

  it("should download some changesets based on range", async () => {
    // Arrange
    const downloadPath = Constants.TestDownloadDirectoryPath;
    const downloadChangesetsParams: DownloadChangesetsParams = {
      requestContext,
      imodelId: testiModelForDownload.id,
      urlParams: {
        afterIndex: 5,
        lastIndex: 10
      },
      targetDirectoryPath: downloadPath
    };

    // Act
    const changesets = await imodelsClient.Changesets.download(downloadChangesetsParams);

    // Assert
    const expectedChangesetCount = downloadChangesetsParams.urlParams.lastIndex - downloadChangesetsParams.urlParams.afterIndex;
    expect(changesets.length).to.equal(expectedChangesetCount);
    expect(fs.readdirSync(downloadPath).length).to.equal(expectedChangesetCount);
    expect(changesets.map(changeset => changeset.index)).to.have.members([6, 7, 8, 9, 10]);

    for (const changeset of changesets) {
      const changesetMetadata = TestiModelMetadata.Changesets.find(changesetMetadata => changesetMetadata.index === changeset.index)
      assertChangeset({
        actualChangeset: changeset,
        expectedChangesetProperties: {
          id: changesetMetadata.id,
          briefcaseId: TestiModelMetadata.Briefcase.id,
          parentId: changesetMetadata.parentId,
          description: changesetMetadata.description,
          containingChanges: changesetMetadata.containingChanges,
          changesetFilePath: changesetMetadata.changesetFilePath
        }
      });

      expect(fs.existsSync(changeset.filePath)).to.equal(true);
      expect(fs.statSync(changeset.filePath).size).to.equal(fs.statSync(changesetMetadata.changesetFilePath).size);
    }
  });
});
