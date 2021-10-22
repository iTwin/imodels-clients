/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { AcquireBriefcaseParams, AuthorizationCallback, AzureSdkFileHandler, Changeset, CreateChangesetParams, DownloadChangesetsParams, iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, FileTransferLog, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelCreator, TestiModelFileProvider, TestiModelGroup, TrackableTestFileHandler, assertChangeset, assertDownloadedChangeset, cleanUpiModels, cleanupDirectory, iModelMetadata } from "../common";

describe("[Authoring] ChangesetOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  let testiModelForWrite: iModelMetadata;
  let testiModelForDownload: ReusableiModelMetadata;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringChangesetOperations"
      }
    });

    testiModelForWrite = await TestiModelCreator.createEmpty({
      authorization,
      imodelsClient,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });
    testiModelForDownload = await ReusableTestiModelProvider.getOrCreate({
      authorization,
      imodelsClient,
      projectId
    });
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
  });

  it("should create changeset", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      imodelId: testiModelForWrite.id
    };
    const briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    const changesetMetadata = TestiModelFileProvider.changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: changesetMetadata.id,
        filePath: changesetMetadata.filePath
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
      authorization,
      imodelId: testiModelForDownload.id,
      targetDirectoryPath: downloadPath
    };

    // Act
    const changesets = await imodelsClient.Changesets.download(downloadChangesetsParams);

    // Assert
    expect(changesets.length).to.equal(TestiModelFileProvider.changesets.length);
    expect(fs.readdirSync(downloadPath).length).to.equal(TestiModelFileProvider.changesets.length);

    for (const changeset of changesets) {
      const changesetMetadata = TestiModelFileProvider.changesets.find(changesetMetadata => changesetMetadata.index === changeset.index)!;
      assertDownloadedChangeset({
        actualChangeset: changeset,
        expectedChangesetProperties: {
          id: changesetMetadata.id,
          briefcaseId: testiModelForDownload.briefcase.id,
          parentId: changesetMetadata.parentId,
          description: changesetMetadata.description,
          containingChanges: changesetMetadata.containingChanges
        }
      });
    }
  });

  it("should download some changesets based on range", async () => {
    // Arrange
    const downloadPath = Constants.TestDownloadDirectoryPath;
    const downloadChangesetsParams: DownloadChangesetsParams = {
      authorization,
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
    const expectedChangesetCount = downloadChangesetsParams.urlParams!.lastIndex! - downloadChangesetsParams.urlParams!.afterIndex!;
    expect(changesets.length).to.equal(expectedChangesetCount);
    expect(fs.readdirSync(downloadPath).length).to.equal(expectedChangesetCount);
    expect(changesets.map((changeset: Changeset) => changeset.index)).to.have.members([6, 7, 8, 9, 10]);

    for (const changeset of changesets) {
      const changesetMetadata = TestiModelFileProvider.changesets.find(changesetMetadata => changesetMetadata.index === changeset.index)!;
      assertDownloadedChangeset({
        actualChangeset: changeset,
        expectedChangesetProperties: {
          id: changesetMetadata.id,
          briefcaseId: testiModelForDownload.briefcase.id,
          parentId: changesetMetadata.parentId,
          description: changesetMetadata.description,
          containingChanges: changesetMetadata.containingChanges
        }
      });
    }
  });

  it("should retry changeset download if it fails the first time", async () => {
    // Arrange
    const fileTransferLog = new FileTransferLog();
    const azureSdkFileHandler = new AzureSdkFileHandler();
    let hasDownloadFailed = false;
    const downloadStub = (downloadUrl: string, targetPath: string) => {
      fileTransferLog.recordDownload(downloadUrl);

      if (!hasDownloadFailed) {
        hasDownloadFailed = true;
        throw new Error("Download failed.");
      }

      return azureSdkFileHandler.downloadFile(downloadUrl, targetPath);
    };

    const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
    const imodelsClientWithTrackedFileTransfer = new iModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

    const downloadPath = Constants.TestDownloadDirectoryPath;
    const downloadChangesetsParams: DownloadChangesetsParams = {
      authorization,
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
      authorization,
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
