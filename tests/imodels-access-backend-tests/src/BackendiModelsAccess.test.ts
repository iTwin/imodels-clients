/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { assert } from "console";
import fs from "node:fs";
import path from "node:path";

import { AcquireNewBriefcaseIdArg, BriefcaseDbArg, ChangesetRangeArg, CheckpointProps, CreateNewIModelProps, DownloadChangesetRangeArg, DownloadRequest, IModelHost, IModelIdArg, IModelJsFs, LockMap, LockProps, LockState, PhysicalModel, ProgressFunction, ProgressStatus, StandaloneDb, V2CheckpointAccessProps } from "@itwin/core-backend";
import { Guid, Logger } from "@itwin/core-bentley";
import { BriefcaseId, ChangeSetStatus, ChangesetFileProps, ChangesetIndexAndId, ChangesetType, IModel as CoreIModel, LocalDirName } from "@itwin/core-common";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { IModelOperations } from "@itwin/imodels-client-authoring";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

import { AuthorizationCallback, ContainingChanges, IModel, IModelsClient, IModelsClientOptions, IModelsErrorCode, isIModelsApiError } from "@itwin/imodels-client-authoring";
import { IModelMetadata, ProgressReport, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestITwinProvider, TestUtilTypes, assertAbortError, assertProgressReports, cleanupDirectory, createGuidValue } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider.js";
import { TestIModelHostAuthorizationClient } from "./TestIModelHostAuthorizationClient.js";
import { fileURLToPath } from "node:url";

use(chaiAsPromised);

describe("BackendIModelsAccess", () => {
  const testRunId = createGuidValue();

  let backendIModelsAccess: BackendIModelsAccess;
  let iModelsClient: IModelsClient;
  let authorizationCallback: AuthorizationCallback;
  let accessToken: string;
  let iTwinId: string;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;
  const testDownloadPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../lib/testDownloads");

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);
    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;
    IModelHost.authorizationClient = new TestIModelHostAuthorizationClient(accessToken);

    const testITwinProvider = container.get(TestITwinProvider);
    iTwinId = await testITwinProvider.getOrCreate();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId,
      packageName: "IModelsAccessBackendTests",
      testSuiteName: "BackendIModelsAccess"
    });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));

    await IModelHost.startup();
  });

  beforeEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  afterEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  after(async () => {
    await IModelHost.shutdown();

    await testIModelGroup.cleanupIModels();
  });

  describe("briefcases", () => {
    it("should get current user briefcase ids", async () => {
      // Arrange
      const expectedBriefcaseIds = testIModelForRead.briefcases.map((briefcase) => briefcase.id);
      const getMyBriefcaseIdsParams: IModelIdArg = {
        accessToken,
        iModelId: testIModelForRead.id
      };

      // Act
      const briefcaseIds: BriefcaseId[] = await backendIModelsAccess.getMyBriefcaseIds(getMyBriefcaseIdsParams);

      // Assert
      expect(briefcaseIds.length).to.equal(expectedBriefcaseIds.length);
      expect(briefcaseIds).to.have.members(expectedBriefcaseIds);
    });
  });

  describe("changesets", () => {
    it("should download changesets", async () => {
      // Arrange
      const downloadChangesetsParams: ChangesetRangeArg & { targetDir: LocalDirName } = {
        accessToken,
        iModelId: testIModelForRead.id,
        targetDir: testDownloadPath
      };

      // Act
      const downloadedChangesets: ChangesetFileProps[] = await backendIModelsAccess.downloadChangesets(downloadChangesetsParams);

      // Assert
      expect(downloadedChangesets.length).to.be.equal(testIModelFileProvider.changesets.length);
      for (let i = 0; i < downloadedChangesets.length; i++) {
        const downloadedChangeset = downloadedChangesets[i];
        const expectedChangesetFile = testIModelFileProvider.changesets[i];

        expect(fs.existsSync(downloadedChangeset.pathname)).to.equal(true);
        expect(downloadedChangeset.id).to.be.equal(expectedChangesetFile.id);
        expect(downloadedChangeset.index).to.be.equal(expectedChangesetFile.index);
        expect(downloadedChangeset.parentId).to.be.equal(expectedChangesetFile.parentId);
        expect(downloadedChangeset.description).to.be.equal(expectedChangesetFile.description);
        expect(downloadedChangeset.briefcaseId).to.be.equal(testIModelForRead.briefcases[0].id);
        expect(downloadedChangeset.size).to.be.equal(fs.statSync(expectedChangesetFile.filePath).size);

        if (expectedChangesetFile.containingChanges === ContainingChanges.Schema as number)
          expect(downloadedChangeset.changesType).to.be.equal(ChangesetType.Schema);
        else
          expect(downloadedChangeset.changesType).to.be.equal(ChangesetType.Regular);
      }
    });

    it("should cancel changesets download and finish downloading missing changesets during next download", async () => {
      // Arrange
      const downloadChangesetsParams: DownloadChangesetRangeArg = {
        accessToken,
        iModelId: testIModelForRead.id,
        targetDir: testDownloadPath
      };

      let progressReports: ProgressReport[] = [];
      const progressCallbackFor1stDownload = (downloaded: number, total: number) => {
        progressReports.push({ downloaded, total });
        return downloaded < total / 4 ? ProgressStatus.Continue : ProgressStatus.Abort;
      };
      const progressCallbackFor2ndDownload = (downloaded: number, total: number) => {
        progressReports.push({ downloaded, total });
        return ProgressStatus.Continue;
      };

      // Act #1
      let thrownError: unknown;
      try {
        await backendIModelsAccess.downloadChangesets({
          ...downloadChangesetsParams,
          progressCallback: progressCallbackFor1stDownload
        });
      } catch (error: unknown) {
        thrownError = error;
      }

      // Assert #1
      const expectedErrorNumber = ChangeSetStatus.CHANGESET_ERROR_BASE + 26; // ChangeSetStatus.DownloadCancelled (only available from iTwinJs 3.5)
      expect(thrownError).to.ownProperty("errorNumber", expectedErrorNumber);

      expect(fs.readdirSync(testDownloadPath).length).to.be.greaterThan(0);
      assertProgressReports(progressReports, false);
      progressReports = [];

      // Act #2
      const changesets = await backendIModelsAccess.downloadChangesets({
        ...downloadChangesetsParams,
        progressCallback: progressCallbackFor2ndDownload
      });

      // Assert #2
      expect(changesets.length).to.equal(testIModelFileProvider.changesets.length);

      const downloadedFilesSizeSum = fs.readdirSync(testDownloadPath).reduce((sum, filename) => sum + fs.statSync(path.join(testDownloadPath, filename)).size, 0);
      const expectedSizeSum = changesets.reduce((sum, changeset) => sum + (changeset.size ?? 0), 0);
      expect(downloadedFilesSizeSum).to.equal(expectedSizeSum);

      assertProgressReports(progressReports);
    });
  });

  describe("CreateNewIModel", () => {
    it("should create new empty iModel", async () => {
      const createNewIModelProps: CreateNewIModelProps = {
        accessToken,
        iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test create empty iModel"),
        iTwinId
      };

      const newiModelId = await backendIModelsAccess.createNewIModel(createNewIModelProps);

      expect(newiModelId).to.not.be.empty;
    });

    it("should perform a wal checkpoint", async () => {
      // cspell:disable-next-line
      const filePath = path.join(testDownloadPath, "createnewimodel.bim");
      try {
        // Arrange - Create an iModel and insert some data into it, so that SQLite creates a wal file with that data. https://www.sqlite.org/wal.html for more info.
        const walPath = `${filePath}-wal`;
        const loggerSpy = sinon.spy(Logger, "logWarning").withArgs("BackendIModelsAccess", "Wal file found while uploading file, performing checkpoint.", sinon.match.any);
        // No need to actually talk to the hub, so stub the call to the hub.
        sinon.stub(IModelOperations.prototype, "createFromBaseline").callsFake(async (_params) => {
          return ({id: Guid.createValue()} as unknown) as IModel;
        });
        const testIModel = StandaloneDb.createEmpty(filePath, { rootSubject: { name: "test1"}, allowEdit: JSON.stringify({ txns: true })});
        PhysicalModel.insert(testIModel, CoreIModel.rootSubjectId, "TestModel");
        testIModel.saveChanges();
        expect(testIModel.isOpen).to.be.true;
        expect(IModelJsFs.existsSync(walPath)).to.be.true;
        expect(IModelJsFs.lstatSync(walPath)?.size).to.be.greaterThan(0);
        const arg: CreateNewIModelProps = {
          version0: filePath,
          iModelName: "testimodel",
          iTwinId: Guid.createValue()
        };
        /**
         * NOTE: The below 'await expect' is possibly a test case worth doing but it takes 20 seconds to test due to the busy retry.
         * It first requires that a person does not saveChanges after performing some insert to put the database in a locked state. Commenting out the saveChanges earlier in this test would achieve that.
         * The below line does pass in the current state of the code (itwinjs 4.x), which is useful to know because we'd want a user who is uploading an iModel to get an error
         * that their database is locked due to them not saving changes.
         * await expect(backendIModelsAccess.createNewIModel(arg)).to.eventually.be.rejectedWith("database is locked");
         */

        // Act
        await backendIModelsAccess.createNewIModel(arg);
        // Assert
        expect(IModelJsFs.lstatSync(walPath)?.size).to.be.equal(0);
        expect(loggerSpy.callCount).to.be.equal(1);

        // Arrange
        PhysicalModel.insert(testIModel, CoreIModel.rootSubjectId, "TestModel2");
        testIModel.saveChanges();
        expect(IModelJsFs.lstatSync(walPath)?.size).to.be.greaterThan(0);

        // Act
        testIModel.performCheckpoint();
        expect(IModelJsFs.lstatSync(walPath)?.size).to.be.equal(0);
        await backendIModelsAccess.createNewIModel(arg);

        // Assert - As I expected, the loggerSpy is called a second time below which tells me that we will perform a checkpoint on the iModel even if the WAL file has no contents.
        // This is because the iModel is still open for write, causing the wal file to still exist.
        // This behavior could be changed if desired by first checking the size of the wal file before performing the checkpoint.
        expect(loggerSpy.callCount).to.be.equal(2);

        // Arrange
        testIModel.close();
        // Act
        await backendIModelsAccess.createNewIModel(arg);
        // Assert - Expect that the wal file is gone due to closing testIModel so logger is not called a 3rd time.
        expect(loggerSpy.callCount).to.be.equal(2);
      } finally {
        sinon.restore();
        // Need to reset the authorizationClient after otherwise future tests fail.
        IModelHost.authorizationClient = new TestIModelHostAuthorizationClient(accessToken);
      }
    });
  });

  describe("checkpoints v1", () => {
    it("should download checkpoint for a specific changeset", async () => {
      // Arrange
      const lastNamedVersion = testIModelForRead.namedVersions[testIModelForRead.namedVersions.length - 1];

      const localCheckpointFilePath = path.join(testDownloadPath, "checkpoint_specific_changeset.bim");
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          iTwinId,
          iModelId: testIModelForRead.id,
          changeset: {
            id: lastNamedVersion.changesetId
          }
        }
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      const downloadedCheckpoint: ChangesetIndexAndId = await backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams);

      // Assert
      expect(downloadedCheckpoint.id).to.be.equal(lastNamedVersion.changesetId);
      expect(downloadedCheckpoint.index).to.be.equal(lastNamedVersion.changesetIndex);
      expect(fs.existsSync(localCheckpointFilePath)).to.be.equal(true);
      expect(fs.statSync(localCheckpointFilePath).size).to.be.greaterThan(0);
    });

    it("should query preceding checkpoint v2", async () => {
      // Arrange
      const firstNamedVersion = testIModelForRead.namedVersions[0];
      assert(testIModelFileProvider.changesets.length >= firstNamedVersion.changesetIndex + 1, "Not enough changesets");
      const nextChangeset = testIModelFileProvider.changesets[firstNamedVersion.changesetIndex];
      assert(firstNamedVersion.changesetId !== nextChangeset.id, "Unexpected changeset ids");
      const queryV2CheckpointParams: CheckpointProps = {
        accessToken,
        iTwinId,
        iModelId: testIModelForRead.id,
        changeset: {
          id: nextChangeset.id
        }
      };

      // Act
      const v2checkpointForExactChangeset: V2CheckpointAccessProps | undefined = await backendIModelsAccess.queryV2Checkpoint(queryV2CheckpointParams);
      // Assert
      expect(v2checkpointForExactChangeset).to.be.undefined;

      // Act
      const v2checkpointForChangesetAllowPrecedingParams = { ...queryV2CheckpointParams, allowPreceding: true };
      const v2checkpointForChangesetAllowPreceding: V2CheckpointAccessProps | undefined = await backendIModelsAccess.queryV2Checkpoint(v2checkpointForChangesetAllowPrecedingParams);
      // Assert
      expect(v2checkpointForChangesetAllowPreceding).to.not.be.undefined;
    });

    it("should skip over a preceding v1 checkpoint in favor of finding a preceding v2 checkpoint", async () => {
      // Arrange
      // iModel has 3 checkpoints:
      //  baseline             - v1 and v2
      //  changeset index 5    - only v1 (v2 failed)
      //  changeset index 10   - only v1 (v2 failed)
      // This iModel is a clone of the testIModelFileProvider aka "[do not delete][iModelsClientsTests] Reusable Test iModel"
      // so it will have the same 10 changesets in total.
      const iModelId = "e71f4085-75a6-479c-bab8-dce19b9352f6";
      await assertHardcodedIModelExists(
        iModelId,
        "iModel for queryV2Checkpoint test was not found. Please recreate the test iModel as described within the test, or disable the test.");

      const mostRecentChangeset = testIModelFileProvider.changesets[testIModelFileProvider.changesets.length - 1];
      const queryV2CheckpointParams: CheckpointProps = {
        accessToken,
        iTwinId,
        iModelId,
        changeset: {
          id: mostRecentChangeset.id
        },
        allowPreceding: true
      };

      // Act
      const queryCheckpoint: V2CheckpointAccessProps | undefined = await backendIModelsAccess.queryV2Checkpoint(queryV2CheckpointParams);

      // Assert
      expect(queryCheckpoint).to.not.be.undefined;
      expect(queryCheckpoint!.dbName === "BASELINE.bim").to.be.true;
    });

    it("should download preceding checkpoint if one for current changeset does not exist", async () => {
      // Arrange
      const firstNamedVersion = testIModelForRead.namedVersions[0];
      assert(testIModelFileProvider.changesets.length >= firstNamedVersion.changesetIndex + 1, "Not enough changesets");
      const nextChangeset = testIModelFileProvider.changesets[firstNamedVersion.changesetIndex];
      assert(firstNamedVersion.changesetId !== nextChangeset.id, "Unexpected changeset ids");

      const localCheckpointFilePath = path.join(testDownloadPath, "checkpoint_preceding_changeset.bim");
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          iTwinId,
          iModelId: testIModelForRead.id,
          changeset: {
            id: nextChangeset.id
          }
        }
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      const downloadedCheckpoint: ChangesetIndexAndId = await backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams);

      // Assert
      expect(downloadedCheckpoint.id).to.be.equal(firstNamedVersion.changesetId);
      expect(downloadedCheckpoint.index).to.be.equal(firstNamedVersion.changesetIndex);
      expect(fs.existsSync(localCheckpointFilePath)).to.be.equal(true);
      expect(fs.statSync(localCheckpointFilePath).size).to.be.greaterThan(0);
    });

    it("should skip over a preceding v2 checkpoint in favor of finding a preceding v1 checkpoint", async () => {
      // Arrange
      // iModel has 3 checkpoints
      //  baseline             - v1 and v2
      //  changeset index 5    - only v2 (v1 entry non existent)
      //  changeset index 10   - v1 and v2
      // This iModel is a clone of the testIModelFileProvider aka "[do not delete][iModelsClientsTests] Reusable Test iModel"
      // so it will have the same 10 changesets in total.
      const iModelId = "c53e6b49-020f-4bf6-804b-d320463c5e00";
      await assertHardcodedIModelExists(
        iModelId,
        "iModel for downloadV1Checkpoint test was not found. Please recreate the test iModel as described within the test, or disable the test.");

      const secondToLastChangeset = testIModelFileProvider.changesets[testIModelFileProvider.changesets.length - 2];
      const localCheckpointFilePath = path.join(testDownloadPath, "checkpoint_skip_v2_checkpoint.bim");
      const downloadV1CheckpointParams: DownloadRequest = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          iTwinId,
          iModelId,
          changeset: {
            id: secondToLastChangeset.id
          }
        }
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      const changesetIndexAndId: ChangesetIndexAndId = await backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams);

      // Assert
      expect(changesetIndexAndId.index).to.be.equal(0);
      expect(changesetIndexAndId.id).to.be.null;
    });

    it("should report progress when downloading checkpoint", async () => {
      // Arrange
      const progressLogs: ProgressReport[] = [];
      const progressCallback: ProgressFunction = (downloaded: number, total: number) => {
        progressLogs.push({ downloaded, total });
        return ProgressStatus.Continue;
      };

      const localCheckpointFilePath = path.join(testDownloadPath, "checkpoint_progress_test.bim");
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          iTwinId,
          iModelId: testIModelForRead.id,
          changeset: {
            id: testIModelForRead.namedVersions[0].changesetId
          }
        },
        onProgress: progressCallback
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      await backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams);

      // Assert
      expect(fs.existsSync(localCheckpointFilePath)).to.be.equal(true);
      expect(fs.statSync(localCheckpointFilePath).size).to.be.greaterThan(0);

      assertProgressReports(progressLogs);
      const lastReportedLog = progressLogs[progressLogs.length - 1];
      expect(lastReportedLog.total).to.be.equal(fs.statSync(localCheckpointFilePath).size);
    });

    it("should cancel checkpoint download", async () => {
      // Arrange
      const progressLogs: ProgressReport[] = [];
      const progressCallback: ProgressFunction = (downloaded: number, total: number) => {
        progressLogs.push({ downloaded, total });
        return downloaded > total / 2 ? ProgressStatus.Abort : ProgressStatus.Continue;
      };

      const localCheckpointFilePath = path.join(testDownloadPath, "checkpoint_cancel_test.bim");
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          iTwinId,
          iModelId: testIModelForRead.id,
          changeset: {
            id: testIModelForRead.namedVersions[0].changesetId
          }
        },
        onProgress: progressCallback
      };

      // Act
      let thrownError: unknown;
      try {
        // eslint-disable-next-line deprecation/deprecation
        await backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams);
      } catch (error: unknown) {
        thrownError = error;
      }

      // Assert
      assertAbortError(thrownError);
      assertProgressReports(progressLogs, false);
      const lastReportedLog = progressLogs[progressLogs.length - 1];
      expect(lastReportedLog.total).to.be.greaterThan(fs.statSync(localCheckpointFilePath).size);
    });

    async function assertHardcodedIModelExists(iModelId: string, errorMessage: string): Promise<void> {
      try {
        // Make sure iModel exists since we're hardcoding this ID.
        const iModel = await iModelsClient.iModels.getSingle({
          iModelId,
          authorization: authorizationCallback
        });
        expect(iModel).to.not.be.undefined;
      } catch (error) {
        if (isIModelsApiError(error) && error.code === IModelsErrorCode.IModelNotFound) {
          throw new Error(errorMessage);
        }
        throw error;
      }
    }
  });

  describe("locks", () => {
    let testIModelForWriteBriefcaseIds: BriefcaseId[] = [];

    afterEach(async () => {
      for (const briefcaseId of testIModelForWriteBriefcaseIds) {
        await backendIModelsAccess.releaseBriefcase({
          accessToken,
          iModelId: testIModelForWrite.id,
          briefcaseId
        });
      }
      testIModelForWriteBriefcaseIds = [];
    });

    it("should successfully acquire new locks", async () => {
      // Arrange
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iModelId: testIModelForWrite.id
      };
      const briefcaseId = await backendIModelsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams);
      testIModelForWriteBriefcaseIds.push(briefcaseId);

      const briefcaseDbParams: BriefcaseDbArg = {
        accessToken,
        iModelId: testIModelForWrite.id,
        briefcaseId,
        changeset: { id: "", index: 0 }
      };
      // eslint-disable-next-line deprecation/deprecation
      const locksToAcquire: LockMap = new Map<string, LockState>([
        // eslint-disable-next-line deprecation/deprecation
        ["0x1", LockState.Exclusive],
        // eslint-disable-next-line deprecation/deprecation
        ["0x2", LockState.Exclusive],
        // eslint-disable-next-line deprecation/deprecation
        ["0x3", LockState.Shared]
      ]);

      // Act
      await backendIModelsAccess.acquireLocks(briefcaseDbParams, locksToAcquire);

      // Assert
      await assertLocks({
        lockQueryParams: briefcaseDbParams,
        expectedLocks: locksToAcquire
      });
    });

    it("should successfully release locks", async () => {
      // Arrange
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iModelId: testIModelForWrite.id
      };
      const briefcaseId = await backendIModelsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams);
      testIModelForWriteBriefcaseIds.push(briefcaseId);

      const briefcaseDbParams: BriefcaseDbArg = {
        accessToken,
        iModelId: testIModelForWrite.id,
        briefcaseId,
        changeset: { id: "", index: 0 }
      };

      // eslint-disable-next-line deprecation/deprecation
      const locksToAcquire: LockMap = new Map<string, LockState>();

      const objectIdsDec = Array.from({ length: 201 }, (_, i) => i + 1);
      for (const objectId of objectIdsDec) {
        // eslint-disable-next-line deprecation/deprecation
        locksToAcquire.set(`0x${objectId.toString(16)}`, LockState.Exclusive);
      }

      await backendIModelsAccess.acquireLocks(briefcaseDbParams, locksToAcquire);
      await assertLocks({
        lockQueryParams: briefcaseDbParams,
        expectedLocks: locksToAcquire
      });

      // Act
      await backendIModelsAccess.releaseAllLocks(briefcaseDbParams);

      // Assert
      const actualLocks: LockProps[] = await backendIModelsAccess.queryAllLocks(briefcaseDbParams);
      expect(actualLocks.length).to.be.equal(0);
    });

    async function assertLocks(params: { lockQueryParams: BriefcaseDbArg, expectedLocks: LockMap }): Promise<void> {
      const actualLocks: LockProps[] = await backendIModelsAccess.queryAllLocks(params.lockQueryParams);
      expect(actualLocks.length).to.equal(params.expectedLocks.size);
      for (const [expectedObjectId, expectedLockState] of params.expectedLocks) {
        const actualLock = actualLocks.find((lock) => lock.id === expectedObjectId && lock.state === expectedLockState);
        expect(actualLock).to.not.be.undefined;
      }
    }
  });
});
