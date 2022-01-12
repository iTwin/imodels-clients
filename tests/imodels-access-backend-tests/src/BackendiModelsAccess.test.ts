/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { AcquireNewBriefcaseIdArg, BriefcaseDbArg, ChangesetRangeArg, IModelIdArg, LockMap, LockProps, LockState } from "@itwin/core-backend";
import { BriefcaseId, ChangesetFileProps, ChangesetType, LocalDirName } from "@itwin/core-common";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { expect } from "chai";
import { ContainingChanges, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelFileProvider, TestUtilTypes, cleanupDirectory, TestIModelGroup, TestIModelGroupFactory, createGuidValue, IModelMetadata, TestIModelCreator } from "@itwin/imodels-client-test-utils";
import { getTestDIContainer } from "./TestDiContainerProvider";

describe("BackendIModelsAccess", () => {
  const testRunId = createGuidValue();

  let backendIModelsAccess: BackendIModelsAccess;
  let accessToken: string;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;
  const testDownloadPath = path.join(__dirname, "../lib/testDownloads");

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

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

  beforeEach(() => {
    cleanupDirectory(testDownloadPath);
  });

  afterEach(() => {
    cleanupDirectory(testDownloadPath);
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
  });

  describe("locks", () => {
    it("should successfully acquire new locks", async () => {
      // Arrange
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iModelId: testIModelForWrite.id,
      };
      const briefcaseId = await backendIModelsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams);

      const briefcaseDbParams: BriefcaseDbArg = {
        accessToken,
        iModelId: testIModelForWrite.id,
        briefcaseId,
        changeset: { id: "", index: 0 }
      };
      const locksToAcquire: LockMap = new Map<string, LockState>([
        ["0x1", LockState.Exclusive],
        ["0x2", LockState.Exclusive],
        ["0x3", LockState.Shared],
      ]);

      // Act
      await backendIModelsAccess.acquireLocks(briefcaseDbParams, locksToAcquire)

      // Assert
      assertLocks({
        lockQueryParams: briefcaseDbParams,
        expectedLocks: locksToAcquire
      });
    });


    it("should successfully release locks", async () => {
      // Arrange
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iModelId: testIModelForWrite.id,
      };
      const briefcaseId = await backendIModelsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams);

      const briefcaseDbParams: BriefcaseDbArg = {
        accessToken,
        iModelId: testIModelForWrite.id,
        briefcaseId,
        changeset: { id: "", index: 0 }
      };
      const locksToAcquire: LockMap = new Map<string, LockState>([
        ["0x1", LockState.Exclusive],
        ["0x2", LockState.Exclusive],
        ["0x3", LockState.Shared],
      ]);

      await backendIModelsAccess.acquireLocks(briefcaseDbParams, locksToAcquire)
      assertLocks({
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
      for (let [expectedObjectId, expectedLockState] of params.expectedLocks) {
        const actualLock = actualLocks.find(lock => lock.id === expectedObjectId && lock.state === expectedLockState);
        expect(actualLock).to.not.be.undefined;
      }
    }
  })
});
