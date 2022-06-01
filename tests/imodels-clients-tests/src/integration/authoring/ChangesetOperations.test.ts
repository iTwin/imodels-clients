/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";

import {AzureSdkFileHandler} from "@itwin/imodels-client-authoring/lib/base/internal";
import { expect } from "chai";

import { AcquireBriefcaseParams, AuthorizationCallback, CreateChangesetParams, DownloadChangesetListParams, DownloadFileParams, DownloadedChangeset, IModelScopedOperationParams, IModelsClient, IModelsClientOptions, TargetDirectoryParam } from "@itwin/imodels-client-authoring";
import { FileTransferLog, IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, TrackableTestFileHandler, assertChangeset, assertDownloadedChangeset, cleanupDirectory } from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

type CommonDownloadParams = IModelScopedOperationParams & TargetDirectoryParam;

describe("[Authoring] ChangesetOperations", () => {
  let iModelsClient: IModelsClient;
  let iModelsClientOptions: IModelsClientOptions;
  let authorization: AuthorizationCallback;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    const container = getTestDIContainer();

    iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "AuthoringChangesetOperations" });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should create changeset #1", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iModelId: testIModelForWrite.id
    };
    const briefcase = await iModelsClient.briefcases.acquire(acquireBriefcaseParams);

    const testChangesetFile = testIModelFileProvider.changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: testChangesetFile.id,
        filePath: testChangesetFile.filePath,
        synchronizationInfo: {
          taskId: "11111111-1111-1111-1111-111111111111"
        }
      }
    };

    // Act
    const changeset = await iModelsClient.changesets.create(createChangesetParams);

    // Assert
    const expectedTestChangesetFile = testIModelFileProvider.changesets.find((cs) => cs.id === changeset.id)!;
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: createChangesetParams.changesetProperties,
      expectedTestChangesetFile,
      expectedLinks: {
        namedVersion: false,
        checkpoint: false
      },
      isGetResponse: false
    });
  });

  it("should create changeset #2", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iModelId: testIModelForWrite.id
    };
    const briefcase = await iModelsClient.briefcases.acquire(acquireBriefcaseParams);

    const parentChangesetFile = testIModelFileProvider.changesets[0];
    const testChangesetFile = testIModelFileProvider.changesets[1];
    const createChangesetParams: CreateChangesetParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: testChangesetFile.id,
        parentId: parentChangesetFile.id,
        filePath: testChangesetFile.filePath,
        synchronizationInfo: {
          taskId: "11111111-1111-1111-1111-111111111111",
          changedFiles: [
            "foo.bim"
          ]
        }
      }
    };

    // Act
    const changeset = await iModelsClient.changesets.create(createChangesetParams);

    // Assert
    const expectedTestChangesetFile = testIModelFileProvider.changesets.find((cs) => cs.id === changeset.id)!;
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: createChangesetParams.changesetProperties,
      expectedTestChangesetFile,
      expectedLinks: {
        namedVersion: false,
        checkpoint: false
      },
      isGetResponse: false
    });
  });

  describe("download operations", () => {
    it("should download all changesets", async () => {
      // Arrange
      const downloadPath = path.join(Constants.TestDownloadDirectoryPath, "[Authoring] ChangesetOperations", "download all changesets test");
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        iModelId: testIModelForRead.id,
        targetDirectoryPath: downloadPath
      };

      // Act
      const changesets = await iModelsClient.changesets.downloadList(downloadChangesetListParams);

      // Assert
      expect(changesets.length).to.equal(testIModelFileProvider.changesets.length);
      expect(fs.readdirSync(downloadPath).length).to.equal(testIModelFileProvider.changesets.length);

      for (const changeset of changesets) {
        const testChangesetFile = testIModelFileProvider.changesets.find((cs) => cs.index === changeset.index)!;
        const changesetHasNamedVersion = !!testIModelForRead.namedVersions.find((version) => version.changesetIndex === changeset.index);
        await assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: testChangesetFile.id,
            briefcaseId: testIModelForRead.briefcase.id,
            parentId: testChangesetFile.parentId,
            description: testChangesetFile.description,
            containingChanges: testChangesetFile.containingChanges,
            synchronizationInfo: testChangesetFile.synchronizationInfo
          },
          expectedLinks: {
            namedVersion: changesetHasNamedVersion,
            checkpoint: true
          },
          expectedTestChangesetFile: testChangesetFile
        });
      }
    });

    it("should download some changesets based on range", async () => {
      // Arrange
      const downloadPath = path.join(Constants.TestDownloadDirectoryPath, "[Authoring] ChangesetOperations", "download range test");
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        iModelId: testIModelForRead.id,
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
        const testChangesetFile = testIModelFileProvider.changesets.find((cs) => cs.index === changeset.index)!;
        const changesetHasNamedVersion = !!testIModelForRead.namedVersions.find((version) => version.changesetIndex === changeset.index);
        await assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: testChangesetFile.id,
            briefcaseId: testIModelForRead.briefcase.id,
            parentId: testChangesetFile.parentId,
            description: testChangesetFile.description,
            containingChanges: testChangesetFile.containingChanges,
            synchronizationInfo: testChangesetFile.synchronizationInfo
          },
          expectedLinks: {
            namedVersion: changesetHasNamedVersion,
            checkpoint: true
          },
          expectedTestChangesetFile: testChangesetFile
        });
      }
    });

    [
      {
        label: "id",
        get changesetUnderTest() {
          return testIModelFileProvider.changesets[0];
        },
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
        get changesetUnderTest() {
          return testIModelFileProvider.changesets[0];
        },
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
        const downloadPath = path.join(Constants.TestDownloadDirectoryPath, "[Authoring] ChangesetOperations", `download by ${testCase.label} test`);
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iModelId: testIModelForRead.id,
          targetDirectoryPath: downloadPath
        };

        // Act
        const changeset = await testCase.functionUnderTest(partialDownloadChangesetParams);

        // Assert
        const testChangesetFile = testCase.changesetUnderTest;
        const changesetHasNamedVersion = !!testIModelForRead.namedVersions.find((version) => version.changesetIndex === changeset.index);
        await assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: testChangesetFile.id,
            briefcaseId: testIModelForRead.briefcase.id,
            parentId: testChangesetFile.parentId,
            description: testChangesetFile.description,
            containingChanges: testChangesetFile.containingChanges,
            synchronizationInfo: testChangesetFile.synchronizationInfo
          },
          expectedLinks: {
            namedVersion: changesetHasNamedVersion,
            checkpoint: true
          },
          expectedTestChangesetFile: testChangesetFile
        });
      });
    });

    [
      {
        label: "by id",
        get functionUnderTest() {
          return async (client: IModelsClient, params: CommonDownloadParams) =>
            client.changesets.downloadSingle({
              ...params,
              changesetId: testIModelFileProvider.changesets[0].id
            });
        }
      },
      {
        label: "by index",
        get functionUnderTest() {
          return async (client: IModelsClient, params: CommonDownloadParams) =>
            client.changesets.downloadSingle({
              ...params,
              changesetIndex: 1
            });
        }
      },
      {
        label: "list",
        get functionUnderTest() {
          return async (client: IModelsClient, params: CommonDownloadParams) =>
            client.changesets
              .downloadList({
                ...params,
                urlParams: { afterIndex: 0, lastIndex: 1 }
              })
              .then((changesets) => changesets[0]);
        }
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
        const iModelsClientWithTrackedFileTransfer = new IModelsClient({ ...iModelsClientOptions, fileHandler: trackedFileHandler });

        const downloadPath = path.join(Constants.TestDownloadDirectoryPath, "[Authoring] ChangesetOperations", `download ${testCase.label} retry test`);
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iModelId: testIModelForRead.id,
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
        const iModelsClientWithTrackedFileTransfer = new IModelsClient({ ...iModelsClientOptions, fileHandler: trackedFileHandler });

        const downloadPath = path.join(Constants.TestDownloadDirectoryPath, "[Authoring] ChangesetOperations", `download ${testCase.label} reuse test`);
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iModelId: testIModelForRead.id,
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
