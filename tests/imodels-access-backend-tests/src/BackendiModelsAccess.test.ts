/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { assert } from "console";
import * as fs from "fs";
import * as path from "path";

import { AcquireNewBriefcaseIdArg, BriefcaseDbArg, ChangesetRangeArg, CheckpointProps, DownloadChangesetRangeArg, IModelHost, IModelIdArg, LockMap, LockProps, LockState, ProgressFunction, ProgressStatus, V2CheckpointAccessProps } from "@itwin/core-backend";
import { BriefcaseId, ChangeSetStatus, ChangesetFileProps, ChangesetIndexAndId, ChangesetType, LocalDirName } from "@itwin/core-common";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { expect } from "chai";

import { AuthorizationCallback, ContainingChanges, IModelsClient, IModelsClientOptions, IModelsErrorCode, isIModelsApiError } from "@itwin/imodels-client-authoring";
import { IModelMetadata, ProgressReport, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestITwinProvider, TestUtilTypes, assertAbortError, assertProgressReports, cleanupDirectory, createGuidValue } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";

class TestAuthorizationClient {
  constructor(private _accessToken: string) {
  }

  public async getAccessToken(): Promise<string> {
    return this._accessToken;
  }
}

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
  const testDownloadPath = path.join(__dirname, "../lib/testDownloads");

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);
    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;
    IModelHost.authorizationClient = new TestAuthorizationClient(accessToken);

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
  });

  beforeEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  afterEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  describe("briefcases", () => {
    it("should get current user briefcase ids", async () => {
      // Arrange
      const getMyBriefcaseIdsParams: IModelIdArg = {
        accessToken,
        iModelId: testIModelForRead.id
      };

      // Act
      const briefcaseIds: BriefcaseId[] = await backendIModelsAccess.getMyBriefcaseIds(getMyBriefcaseIdsParams);

      // Assert
      expect(briefcaseIds.length).to.equal(1);
      const briefcaseId = briefcaseIds[0];
      expect(briefcaseId).to.equal(testIModelForRead.briefcase.id);
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
        expect(downloadedChangeset.briefcaseId).to.be.equal(testIModelForRead.briefcase.id);
        expect(downloadedChangeset.size).to.be.equal(fs.statSync(expectedChangesetFile.filePath).size);

        if (expectedChangesetFile.containingChanges === ContainingChanges.Schema)
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
        progressReports.push({downloaded, total});
        return downloaded < total / 4 ? ProgressStatus.Continue : ProgressStatus.Abort;
      };
      const progressCallbackFor2ndDownload = (downloaded: number, total: number) => {
        progressReports.push({downloaded, total});
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
      const v2checkpointForChangesetAllowPrecedingParams = {...queryV2CheckpointParams, allowPreceding: true};
      const v2checkpointForChangesetAllowPreceding: V2CheckpointAccessProps | undefined = await backendIModelsAccess.queryV2Checkpoint(v2checkpointForChangesetAllowPrecedingParams);
      // Assert
      expect(v2checkpointForChangesetAllowPreceding).to.not.be.undefined;
    });

    it("should skip over a preceding v1 checkpoint in favor of finding a preceding v2 checkpoint", async () => {
      // Arrange
      // iModel has 3 checkpoints. changeset index 10 has only v1 checkpoint, changeset index 5 has only v1 checkpoint. iModel has only 10 changesets. baseline has v1 and v2 checkpoint.
      // This iModel is a clone of the testIModelFileProvider aka "[do not delete][iModelsClientsTests] Reusable Test iModel" so it will have the same changesets.
      const iModelId = "1aca14e4-32df-44d3-85d7-b892959a0fba";
      try {
        // Make sure iModel exists since we're hardcoding this ID.
        const iModel = await iModelsClient.iModels.getSingle({
          iModelId,
          authorization: authorizationCallback
        });
        expect(iModel).to.not.be.undefined;
      } catch (error) {
        if (isIModelsApiError(error) && error.code === IModelsErrorCode.IModelNotFound) {
          throw new Error("iModel was not found. Please recreate the test iModel as described within the test, or disable the test.");
        }
        throw error;
      }

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
      const locksToAcquire: LockMap = new Map<string, LockState>([
        ["0x1", LockState.Exclusive],
        ["0x2", LockState.Exclusive],
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


      const locksToAcquire: LockMap = new Map<string, LockState>();

      var objectIdsDec = Array.from({length: 201}, (_, i) => i + 1);
      for (const objectId of objectIdsDec){
        locksToAcquire.set("0x" + objectId.toString(16), LockState.Exclusive);
      };

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
