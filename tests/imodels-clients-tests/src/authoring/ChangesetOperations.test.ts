/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { AcquireBriefcaseParams, AuthorizationCallback, AzureSdkFileHandler, CreateChangesetParams, DownloadChangesetListParams, DownloadFileParams, DownloadedChangeset, IModelScopedOperationParams, IModelsClient,TargetDirectoryParam } from "@itwin/imodels-client-authoring";
import { Config, Constants, FileTransferLog, IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestClientOptions, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestProjectProvider, TrackableTestFileHandler, assertChangeset, assertDownloadedChangeset, cleanUpIModels, cleanupDirectory } from "../common";

type CommonDownloadParams = IModelScopedOperationParams & TargetDirectoryParam;

describe("[Authoring] ChangesetOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;

  let testIModelForWrite: IModelMetadata;
  let testIModelForDownload: ReusableIModelMetadata;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringChangesetOperations"
      }
    });

    testIModelForWrite = await TestIModelCreator.createEmpty({
      authorization,
      iModelsClient,
      projectId,
      iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    });
    testIModelForDownload = await ReusableTestIModelProvider.getOrCreate({
      authorization,
      iModelsClient,
      projectId
    });
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  it("should create changeset", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iModelId: testIModelForWrite.id
    };
    const briefcase = await iModelsClient.briefcases.acquire(acquireBriefcaseParams);

    const changesetMetadata = TestIModelFileProvider.changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: changesetMetadata.id,
        filePath: changesetMetadata.filePath
      }
    };

    // Act
    const changeset = await iModelsClient.changesets.create(createChangesetParams);

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
        iModelId: testIModelForDownload.id,
        targetDirectoryPath: downloadPath
      };

      // Act
      const changesets = await iModelsClient.changesets.downloadList(downloadChangesetListParams);

      // Assert
      expect(changesets.length).to.equal(TestIModelFileProvider.changesets.length);
      expect(fs.readdirSync(downloadPath).length).to.equal(TestIModelFileProvider.changesets.length);

      for (const changeset of changesets) {
        const changesetMetadata = TestIModelFileProvider.changesets.find((cs) => cs.index === changeset.index)!;
        assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: changesetMetadata.id,
            briefcaseId: testIModelForDownload.briefcase.id,
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
        iModelId: testIModelForDownload.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10
        },
        targetDirectoryPath: downloadPath
      };

      // Act
      const changesets = await iModelsClient.changesets.downloadList(downloadChangesetListParams);

      // Assert
      const expectedChangesetCount = downloadChangesetListParams.urlParams!.lastIndex! - downloadChangesetListParams.urlParams!.afterIndex!;
      expect(changesets.length).to.equal(expectedChangesetCount);
      expect(fs.readdirSync(downloadPath).length).to.equal(expectedChangesetCount);
      expect(changesets.map((changeset: DownloadedChangeset) => changeset.index)).to.have.members([6, 7, 8, 9, 10]);

      for (const changeset of changesets) {
        const changesetMetadata = TestIModelFileProvider.changesets.find((cs) => cs.index === changeset.index)!;
        assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: changesetMetadata.id,
            briefcaseId: testIModelForDownload.briefcase.id,
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
        changesetUnderTest: TestIModelFileProvider.changesets[0],
        get functionUnderTest() {
          return async (params: CommonDownloadParams) => iModelsClient.changesets.downloadSingle(
            {
              ...params,
              changesetId: this.changesetUnderTest.id
            });
        }
      },
      {
        label: "index",
        changesetUnderTest: TestIModelFileProvider.changesets[0],
        get functionUnderTest() {
          return async (params: CommonDownloadParams) => iModelsClient.changesets.downloadSingle(
            {
              ...params,
              changesetIndex: this.changesetUnderTest.index
            });
        }
      }
    ].forEach((testCase) => {
      it(`should download changeset by ${testCase.label}`, async () => {
        // Arrange
        const downloadPath = Constants.TestDownloadDirectoryPath;
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iModelId: testIModelForDownload.id,
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
            briefcaseId: testIModelForDownload.briefcase.id,
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
        functionUnderTest: async (client: IModelsClient, params: CommonDownloadParams) =>
          client.changesets.downloadSingle({
            ...params,
            changesetId: TestIModelFileProvider.changesets[0].id
          })
      },
      {
        label: "by index",
        functionUnderTest: async (client: IModelsClient, params: CommonDownloadParams) =>
          client.changesets.downloadSingle({
            ...params,
            changesetIndex: TestIModelFileProvider.changesets[0].index
          })
      },
      {
        label: "list",
        functionUnderTest: async (client: IModelsClient, params: CommonDownloadParams) =>
          client.changesets
            .downloadList({
              ...params,
              urlParams: { afterIndex: 0, lastIndex: 1 }
            })
            .then((changesets) => changesets[0])
      }
    ].forEach((testCase) => {
      it(`should should retry changeset download if it fails the first time when downloading changeset ${testCase.label}`, async () => {
        // Arrange
        const fileTransferLog = new FileTransferLog();
        const azureSdkFileHandler = new AzureSdkFileHandler();
        let hasDownloadFailed = false;
        const downloadStub = async (params: DownloadFileParams) => {
          fileTransferLog.recordDownload(params.downloadUrl);

          if (!hasDownloadFailed) {
            hasDownloadFailed = true;
            throw new Error("Download failed.");
          }

          return azureSdkFileHandler.downloadFile(params);
        };

        const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
        const iModelsClientWithTrackedFileTransfer = new IModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

        const downloadPath = Constants.TestDownloadDirectoryPath;
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iModelId: testIModelForDownload.id,
          targetDirectoryPath: downloadPath
        };

        // Act
        const changeset: DownloadedChangeset = await testCase.functionUnderTest(iModelsClientWithTrackedFileTransfer, partialDownloadChangesetParams);

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
        const downloadStub = async (params: DownloadFileParams) => {
          fileTransferLog.recordDownload(params.downloadUrl);
          return azureSdkFileHandler.downloadFile(params);
        };

        const trackedFileHandler = new TrackableTestFileHandler(azureSdkFileHandler, { downloadStub });
        const iModelsClientWithTrackedFileTransfer = new IModelsClient({ ...new TestClientOptions(), fileHandler: trackedFileHandler });

        const downloadPath = Constants.TestDownloadDirectoryPath;
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iModelId: testIModelForDownload.id,
          targetDirectoryPath: downloadPath
        };

        await testCase.functionUnderTest(iModelsClientWithTrackedFileTransfer, partialDownloadChangesetParams);

        // Act
        const changeset = await testCase.functionUnderTest(iModelsClientWithTrackedFileTransfer, partialDownloadChangesetParams);

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
