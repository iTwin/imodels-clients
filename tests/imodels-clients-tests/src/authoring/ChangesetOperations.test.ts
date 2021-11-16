/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { AcquireBriefcaseParams, AuthorizationCallback, AzureSdkFileHandler, CreateChangesetParams, DownloadChangesetListParams, DownloadFileParams, DownloadedChangeset, TargetDirectoryParam, iModelScopedOperationParams,iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, FileTransferLog, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelCreator, TestiModelFileProvider, TestiModelGroup, TrackableTestFileHandler, assertChangeset, assertDownloadedChangeset, cleanUpiModels, cleanupDirectory, iModelMetadata } from "../common";

type CommonDownloadParams = iModelScopedOperationParams & TargetDirectoryParam;

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
      imodelName: testiModelGroup.getPrefixedUniqueiModelName("Test iModel for write")
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

  describe("download operations", () => {
    it("should download all changesets", async () => {
      // Arrange
      const downloadPath = Constants.TestDownloadDirectoryPath;
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        imodelId: testiModelForDownload.id,
        targetDirectoryPath: downloadPath
      };

      // Act
      const changesets = await imodelsClient.Changesets.downloadList(downloadChangesetListParams);

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
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        imodelId: testiModelForDownload.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10
        },
        targetDirectoryPath: downloadPath
      };

      // Act
      const changesets = await imodelsClient.Changesets.downloadList(downloadChangesetListParams);

      // Assert
      const expectedChangesetCount = downloadChangesetListParams.urlParams!.lastIndex! - downloadChangesetListParams.urlParams!.afterIndex!;
      expect(changesets.length).to.equal(expectedChangesetCount);
      expect(fs.readdirSync(downloadPath).length).to.equal(expectedChangesetCount);
      expect(changesets.map((changeset: DownloadedChangeset) => changeset.index)).to.have.members([6, 7, 8, 9, 10]);

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

    [
      {
        label: "id",
        changesetUnderTest: TestiModelFileProvider.changesets[0],
        get functionUnderTest() {
          return (params: CommonDownloadParams) => imodelsClient.Changesets.downloadSingle(
            {
              ...params,
              changesetId: this.changesetUnderTest.id
            });
        }
      },
      {
        label: "index",
        changesetUnderTest: TestiModelFileProvider.changesets[0],
        get functionUnderTest() {
          return (params: CommonDownloadParams) => imodelsClient.Changesets.downloadSingle(
            {
              ...params,
              changesetIndex: this.changesetUnderTest.index
            });
        }
      }
    ].forEach(testCase => {
      it(`should download changeset by ${testCase.label}`, async () => {
        // Arrange
        const downloadPath = Constants.TestDownloadDirectoryPath;
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          imodelId: testiModelForDownload.id,
          targetDirectoryPath: downloadPath
        };

        // Act
        const changeset = await testCase.functionUnderTest(partialDownloadChangesetParams);

        // Assert
        const changesetMetadata = testCase.changesetUnderTest;
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
      });
    });

    [
      {
        label: "by id",
        functionUnderTest: (client: iModelsClient, params: CommonDownloadParams) =>
          client.Changesets.downloadSingle({
            ...params,
            changesetId: TestiModelFileProvider.changesets[0].id
          })
      },
      {
        label: "by index",
        functionUnderTest: (client: iModelsClient, params: CommonDownloadParams) =>
          client.Changesets.downloadSingle({
            ...params,
            changesetIndex: TestiModelFileProvider.changesets[0].index
          })
      },
      {
        label: "list",
        functionUnderTest: (client: iModelsClient, params: CommonDownloadParams) =>
          client.Changesets
            .downloadList({
              ...params,
              urlParams: { afterIndex: 0, lastIndex: 1 }
            })
            .then(changesets => changesets[0])
      }
    ].forEach(testCase => {
      it(`should should retry changeset download if it fails the first time when downloading changeset ${testCase.label}`, async () => {
        // Arrange
        const fileTransferLog = new FileTransferLog();
        const azureSdkFileHandler = new AzureSdkFileHandler();
        let hasDownloadFailed = false;
        const downloadStub = (params: DownloadFileParams) => {
          fileTransferLog.recordDownload(params.downloadUrl);

          if (!hasDownloadFailed) {
            hasDownloadFailed = true;
            throw new Error("Download failed.");
          }

          return azureSdkFileHandler.downloadFile(params);
        };

        const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
        const imodelsClientWithTrackedFileTransfer = new iModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

        const downloadPath = Constants.TestDownloadDirectoryPath;
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          imodelId: testiModelForDownload.id,
          targetDirectoryPath: downloadPath
        };

        // Act
        const changeset: DownloadedChangeset = await testCase.functionUnderTest(imodelsClientWithTrackedFileTransfer, partialDownloadChangesetParams);

        // Assert
        expect(changeset).to.be.not.be.undefined;

        const allDownloadUrlsCalled = Object.keys(fileTransferLog.downloads);
        expect(allDownloadUrlsCalled.length).to.equal(2);
        expect(allDownloadUrlsCalled[0]).to.contain(changeset.id);
        expect(allDownloadUrlsCalled[1]).to.contain(changeset.id);

        const timesDownloadUrl1WasCalled = fileTransferLog.downloads[allDownloadUrlsCalled[0]];
        expect(timesDownloadUrl1WasCalled).to.equal(1);
        const timesDownloadUrl2WasCalled = fileTransferLog.downloads[allDownloadUrlsCalled[1]];
        expect(timesDownloadUrl2WasCalled).to.equal(1);
      });

      it(`should not download changeset again if it is already present when downloading changeset ${testCase.label}`, async () => {
        // Arrange
        const fileTransferLog = new FileTransferLog();
        const azureSdkFileHandler = new AzureSdkFileHandler();
        const downloadStub = (params: DownloadFileParams) => {
          fileTransferLog.recordDownload(params.downloadUrl);
          return azureSdkFileHandler.downloadFile(params);
        };

        const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
        const imodelsClientWithTrackedFileTransfer = new iModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

        const downloadPath = Constants.TestDownloadDirectoryPath;
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          imodelId: testiModelForDownload.id,
          targetDirectoryPath: downloadPath
        };

        await testCase.functionUnderTest(imodelsClientWithTrackedFileTransfer, partialDownloadChangesetParams);

        // Act
        const changeset = await testCase.functionUnderTest(imodelsClientWithTrackedFileTransfer, partialDownloadChangesetParams);

        // Assert
        expect(changeset).to.be.not.be.undefined;

        const allDownloadUrlsCalled = Object.keys(fileTransferLog.downloads);
        expect(allDownloadUrlsCalled.length).to.equal(1);
        expect(allDownloadUrlsCalled[0]).to.contain(changeset.id);

        const timesDownloadUrlWasCalled = fileTransferLog.downloads[allDownloadUrlsCalled[0]];
        expect(timesDownloadUrlWasCalled).to.equal(1);
      });
    });
  });
});
