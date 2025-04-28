/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { ConflictingLock, ConflictingLocksError, GetLockListParams, IModelsClient, IModelsClientOptions, Lock, LockLevel, LockLevelFilter, LocksError, UpdateLockParams } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, IModelsErrorCode, toArray } from "@itwin/imodels-client-management";
import { IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, assertCollection, assertError, assertLock } from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] LockOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;
  let testIModelForWriteBriefcaseIds: number[] = [];

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "AuthoringLockOperations" });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmptyAndUploadChangesets(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  afterEach(async () => {
    for (const briefcaseId of testIModelForWriteBriefcaseIds) {
      await iModelsClient.briefcases.release({
        authorization,
        iModelId: testIModelForWrite.id,
        briefcaseId
      });
    }
    testIModelForWriteBriefcaseIds = [];
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id
    };

    // Act
    const locks = iModelsClient.locks.getList(getLockListParams);

    // Assert
    await assertCollection({
      asyncIterable: locks,
      isEntityCountCorrect: (count) => count === 1
    });
  });

  it("should return correct values when querying collection with briefcaseId filter", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        briefcaseId: testIModelForRead.briefcases[0].id
      }
    };

    // Act
    const locks = iModelsClient.locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    const lock = lockArray[0];
    assertLock({
      actualLock: lock,
      expectedLock: testIModelForRead.lock
    });
  });

  it("should return empty collection when querying locks for non-existent briefcase", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        briefcaseId: 500
      }
    };

    // Act
    const locks = iModelsClient.locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });

  ([LockLevel.Shared, LockLevel.Exclusive] as LockLevelFilter[]).forEach((lockLevel) => {
    it(`should return correct values when querying collection with lockLevel filter (${lockLevel})`, async () => {
      // Arrange
      const expectedLock: Lock = {
        briefcaseId: testIModelForRead.lock.briefcaseId,
        lockedObjects: testIModelForRead.lock.lockedObjects.filter((lockedObject) => lockedObject.lockLevel === lockLevel)
      };
      expect(expectedLock.lockedObjects.length).to.be.greaterThan(0);

      const getLockListParams: GetLockListParams = {
        authorization,
        iModelId: testIModelForRead.id,
        urlParams: {
          lockLevel
        }
      };

      // Act
      const locks = iModelsClient.locks.getList(getLockListParams);

      // Assert
      const lockArray = await toArray(locks);
      expect(lockArray.length).to.be.equal(1);
      const actualLock = lockArray[0];
      assertLock({
        actualLock,
        expectedLock
      });
    });
  });

  it("should acquire new locks", async () => {
    // Arrange
    const briefcase = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0xaa"]
        },
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xbb"]
        }
      ]
    };

    // Act
    const acquiredLock = await iModelsClient.locks.update(updateLockParams);

    // Assert
    assertLock({
      actualLock: acquiredLock,
      expectedLock: {
        briefcaseId: briefcase.briefcaseId,
        lockedObjects: updateLockParams.lockedObjects
      }
    });
  });

  it("should release locks", async () => {
    // Arrange
    const briefcase = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xcc"]
        }
      ]
    };

    await iModelsClient.locks.update(updateLockParams1);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: testIModelFileProvider.changesets[0].id,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: updateLockParams1.lockedObjects[0].objectIds
        }
      ]
    };

    // Act
    const releasedLock = await iModelsClient.locks.update(updateLockParams2);

    // Assert
    assertLock({
      actualLock: releasedLock,
      expectedLock: {
        briefcaseId: briefcase.briefcaseId,
        lockedObjects: []
      }
    });
  });

  it("should return error when trying to update non-existing lock to LockLevel.None", async () => {
    // Arrange
    const briefcase = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: ["0x1"]
        }
      ]
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.locks.update(updateLockParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.LockNotFound,
        message: "Requested Lock(s) is not available."
      }
    });
  });

  it("should return error when trying to update lock on non-existing iModel", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: "invalid iModel id",
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x2"]
        }
      ]
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.locks.update(updateLockParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.IModelNotFound,
        message: "Requested iModel is not available."
      }
    });
  });

  it("should return error when trying to update lock on non-existing briefcase", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x3"]
        }
      ]
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.locks.update(updateLockParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.BriefcaseNotFound,
        message: "Requested Briefcase is not available."
      }
    });
  });

  it("should return error when trying to update lock with non-existing changeset specified", async () => {
    // Arrange
    const briefcase = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x4"]
        }
      ]
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.locks.update(updateLockParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.ChangesetNotFound,
        message: "Requested Changeset is not available."
      }
    });
  });

  it("should return error when trying to acquire exclusive lock on an object that is already locked by another briefcase", async () => {
    // Arrange
    const briefcase1 = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"]
        }
      ]
    };

    await iModelsClient.locks.update(updateLockParams1);

    const briefcase2 = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: updateLockParams1.lockedObjects[0].objectIds
        }
      ]
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.locks.update(updateLockParams2);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.ConflictWithAnotherUser,
        message:
          "Lock(s) is owned by another Briefcase. Conflicting locks:\n" +
          `1. Object id: 0x5, lock level: shared, briefcase ids: ${briefcase1.briefcaseId}\n`
      }
    });
    const conflictingLocks = (objectThrown as ConflictingLocksError).conflictingLocks;
    expect(conflictingLocks).to.not.be.undefined;
    expect(conflictingLocks!.length).to.be.equal(1);
    const conflictingLock: ConflictingLock = conflictingLocks![0];
    expect(conflictingLock.objectId).to.be.equal("0x5");
    expect(conflictingLock.lockLevel).to.be.equal(LockLevel.Shared);
    expect(conflictingLock.briefcaseIds.length).to.be.equal(1);
    expect(conflictingLock.briefcaseIds[0]).to.be.equal(briefcase1.briefcaseId);
  });

  it("should return error when trying to acquire lock on an object that has been locked by a more recent changeset", async () => {
    // Arrange
    const briefcase1 = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetId: testIModelFileProvider.changesets[5].id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"]
        }
      ]
    };

    await iModelsClient.locks.update(updateLockParams1);

    const briefcase2 = await iModelsClient.briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetId: testIModelFileProvider.changesets[4].id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: updateLockParams1.lockedObjects
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.locks.update(updateLockParams2);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.NewerChangesExist,
        message: "One or more objects have been locked in a newer Changeset. Object ids: 0x5"
      }
    });
    const objectIds = (objectThrown as LocksError).objectIds;
    expect(objectIds).to.not.be.undefined;
    expect(objectIds!.length).to.be.equal(1);
    const objectId = objectIds![0];
    expect(objectId).to.be.equal("0x5");
  });
});
