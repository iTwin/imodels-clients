/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { AcquireBriefcaseParams, AzureSdkFileHandler, CreateChangesetParams, DownloadChangesetsParams, FileTransferStatus, RequestContext, iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, TestiModelMetadata, TrackableTestFileHandler, cleanUpiModels, cleanupDirectory, createEmptyiModel, findiModelWithName } from "../common";
import { assertChangeset } from "../common/AssertionUtils";
import { FileTransferLog } from "../common/TrackableTestFileHandler";

describe("[Authoring] ChangesetOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  let testiModelForWrite: iModel;
  let testiModelForDownload: iModel;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

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
      const changesetMetadata = TestiModelMetadata.Changesets.find(changesetMetadata => changesetMetadata.index === changeset.index);
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

      expect(fs.existsSync(changeset.downloadedFilePath)).to.equal(true);
      expect(fs.statSync(changeset.downloadedFilePath).size).to.equal(fs.statSync(changesetMetadata.changesetFilePath).size);
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
      const changesetMetadata = TestiModelMetadata.Changesets.find(changesetMetadata => changesetMetadata.index === changeset.index);
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

      expect(fs.existsSync(changeset.downloadedFilePath)).to.equal(true);
      expect(fs.statSync(changeset.downloadedFilePath).size).to.equal(fs.statSync(changesetMetadata.changesetFilePath).size);
    }
  });

  it("should retry changeset download if it fails with intermittent failure", async () => {
    // Arrange
    const fileTransferLog = new FileTransferLog();
    const azureSdkFileHandler = new AzureSdkFileHandler();
    let hasDownloadFailed = false;
    const downloadStub = (downloadUrl: string, targetPath: string) => {
      fileTransferLog.recordDownload(downloadUrl);

      if (!hasDownloadFailed) {
        hasDownloadFailed = true;
        return Promise.resolve(FileTransferStatus.IntermittentFailure);
      }

      return azureSdkFileHandler.downloadFile(downloadUrl, targetPath);
    };

    const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
    const imodelsClientWithTrackedFileTransfer = new iModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

    const downloadPath = Constants.TestDownloadDirectoryPath;
    const downloadChangesetsParams: DownloadChangesetsParams = {
      requestContext,
      imodelId: testiModelForDownload.id,
      urlParams: {
        afterIndex: 0,
        lastIndex: 1
      },
      targetDirectoryPath: downloadPath
    };

    // Act
    const changesets = await imodelsClientWithTrackedFileTransfer.Changesets.download(downloadChangesetsParams);

    // Assert
    expect(changesets.length).to.equal(1);

    const allDownloadUrlsCalled = Object.keys(fileTransferLog.downloads);
    expect(allDownloadUrlsCalled.length).to.equal(2);
    expect(allDownloadUrlsCalled[0]).to.contain(changesets[0].id);
    expect(allDownloadUrlsCalled[1]).to.contain(changesets[0].id);

    const timesDownloadUrl1WasCalled = fileTransferLog.downloads[allDownloadUrlsCalled[0]];
    expect(timesDownloadUrl1WasCalled).to.equal(1);
    const timesDownloadUrl2WasCalled = fileTransferLog.downloads[allDownloadUrlsCalled[1]];
    expect(timesDownloadUrl2WasCalled).to.equal(1);
  });

  it("should not download changeset again if it is already present", async () => {
    // Arrange
    const fileTransferLog = new FileTransferLog();
    const azureSdkFileHandler = new AzureSdkFileHandler();
    const downloadStub = (downloadUrl: string, targetPath: string) => {
      fileTransferLog.recordDownload(downloadUrl);
      return azureSdkFileHandler.downloadFile(downloadUrl, targetPath);
    };

    const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
    const imodelsClientWithTrackedFileTransfer = new iModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

    const downloadPath = Constants.TestDownloadDirectoryPath;
    const downloadChangesetsParams: DownloadChangesetsParams = {
      requestContext,
      imodelId: testiModelForDownload.id,
      urlParams: {
        afterIndex: 0,
        lastIndex: 1
      },
      targetDirectoryPath: downloadPath
    };

    await imodelsClientWithTrackedFileTransfer.Changesets.download(downloadChangesetsParams);

    // Act
    const changesets = await imodelsClientWithTrackedFileTransfer.Changesets.download(downloadChangesetsParams);

    // Assert
    expect(changesets.length).to.equal(1);

    const allDownloadUrlsCalled = Object.keys(fileTransferLog.downloads);
    expect(allDownloadUrlsCalled.length).to.equal(1);
    expect(allDownloadUrlsCalled[0]).to.contain(changesets[0].id);

    const timesDownloadUrlWasCalled = fileTransferLog.downloads[allDownloadUrlsCalled[0]];
    expect(timesDownloadUrlWasCalled).to.equal(1);
  });
});
